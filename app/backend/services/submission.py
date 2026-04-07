"""
services/submission.py
SubmissionService.execute() — the "Two-Phase" write (design p.10-11):
  Phase A: Validate diff map
  Phase B: Upsert rows into ProcessedRecord (PostgreSQL)
  Phase C: Generate CSV/JSON file with metadata header → /storage volume
  Phase D: Create FileMetadata record with SHA-256 checksum

Wrapped in transaction.atomic(). If file write fails → DB rolls back.
If DB write fails → temp file is deleted before response (design p.11).
"""
import csv
import hashlib
import json
import os
import uuid
from datetime import datetime, timezone

from django.conf import settings
from django.db import transaction

from api.exceptions import PersistenceError
from api.models import ExtractionJob, FileMetadata, ProcessedRecord, User

from core.logging import get_logger
logger = get_logger(__name__)


class SubmissionService:

    @staticmethod
    def execute(
        job_id: str,
        original_data: list[dict],
        modified_data: list[dict],
        file_format: str,
        user: User,
    ) -> FileMetadata:
        """
        Entry point. Raises PersistenceError on any failure,
        guaranteeing no partial writes (design p.11).
        """
        try:
            job = ExtractionJob.objects.select_related("connection").get(
                job_id=job_id,
                status=ExtractionJob.STATUS_SUCCESS,
            )
        except ExtractionJob.DoesNotExist:
            raise PersistenceError("Job not found or not in SUCCESS state.")

        file_id   = uuid.uuid4()
        temp_path = None

        try:
            with transaction.atomic():
                # ── Phase A: compute diff and validate ────────────────────────
                diff = SubmissionService._compute_diff(original_data, modified_data)
                logger.info(
                    "submit job=%s user=%s rows_changed=%d format=%s",
                    job_id, user.id, len(diff), file_format,
                )

                # ── Phase B: upsert rows into ProcessedRecord ─────────────────
                SubmissionService._persist_records(job, modified_data)

                # ── Phase C: write file to /storage volume ────────────────────
                temp_path, checksum = SubmissionService._write_file(
                    file_id, file_format, modified_data, job, user
                )

                # ── Phase D: create FileMetadata record ───────────────────────
                file_meta = FileMetadata.objects.create(
                    file_id=file_id,
                    file_path=temp_path,
                    format=file_format,
                    owner=user,
                    job=job,
                    source_metadata={
                        "source_db":      job.connection.name,
                        "db_type":        job.connection.db_type,
                        "extracted_at":   job.created_at.isoformat(),
                        "submitted_at":   datetime.now(timezone.utc).isoformat(),
                        "rows_total":     len(modified_data),
                        "rows_changed":   len(diff),
                        "original_query": job.query_metadata.get("query", ""),
                    },
                    checksum=checksum,
                )
                return file_meta

        except PersistenceError:
            # Clean up temp file if the DB transaction is being rolled back
            _cleanup(temp_path)
            raise

        except Exception as exc:
            # Any unexpected error → roll back DB + delete temp file (design p.11)
            _cleanup(temp_path)
            logger.error("SubmissionService failed for job %s: %s", job_id, exc)
            raise PersistenceError(f"Submission failed: {exc}") from exc

    # ── Internals ─────────────────────────────────────────────────────────────

    @staticmethod
    def _compute_diff(original: list[dict], modified: list[dict]) -> list[dict]:
        """
        Returns only the rows where at least one field changed.
        Preserves the DiffMap concept from the frontend (design p.8).
        """
        diff = []
        orig_map = {i: row for i, row in enumerate(original)}
        for i, mod_row in enumerate(modified):
            orig_row = orig_map.get(i, {})
            if any(mod_row.get(k) != orig_row.get(k) for k in mod_row):
                diff.append(mod_row)
        return diff

    @staticmethod
    def _persist_records(job: ExtractionJob, rows: list[dict]) -> None:
        """
        Bulk-delete existing records for this job then bulk-create new ones.
        Stays inside the outer transaction.atomic() so failures roll back.
        """
        ProcessedRecord.objects.filter(job=job).delete()
        ProcessedRecord.objects.bulk_create([
            ProcessedRecord(job=job, data=row, row_index=i)
            for i, row in enumerate(rows)
        ], batch_size=1000)

    @staticmethod
    def _write_file(
        file_id: uuid.UUID,
        file_format: str,
        rows: list[dict],
        job: ExtractionJob,
        user: User,
    ) -> tuple[str, str]:
        """
        Writes CSV or JSON to the /storage volume with a metadata header.
        Returns (absolute_path, sha256_checksum).
        Raises PersistenceError if the disk write fails (design p.11).
        """
        os.makedirs(settings.STORAGE_ROOT, exist_ok=True)
        filename  = f"{file_id}.{file_format}"
        file_path = os.path.join(settings.STORAGE_ROOT, filename)

        metadata_header = {
            "dcp_export":     True,
            "file_id":        str(file_id),
            "source_db_id":   str(job.connection.id),
            "extracted_at":   job.created_at.isoformat(),
            "submitted_by":   str(user.id),
            "row_count":      len(rows),
        }

        try:
            if file_format == FileMetadata.FORMAT_JSON:
                payload = {"_metadata": metadata_header, "data": rows}
                content = json.dumps(payload, indent=2, default=str)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)

            elif file_format == FileMetadata.FORMAT_CSV:
                with open(file_path, "w", newline="", encoding="utf-8") as f:
                    # Write metadata as commented header lines
                    for k, v in metadata_header.items():
                        f.write(f"# {k}: {v}\n")

                    if rows:
                        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
                        writer.writeheader()
                        writer.writerows(rows)

            else:
                raise PersistenceError(f"Unsupported format: {file_format}")

        except OSError as exc:
            # Disk full, permission denied, etc. → triggers atomic rollback
            raise PersistenceError(f"File write failed: {exc}") from exc

        checksum = _sha256(file_path)
        return file_path, checksum


# ── Helpers ───────────────────────────────────────────────────────────────────

def _sha256(file_path: str) -> str:
    """Compute SHA-256 of file for integrity verification (design p.11)."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def _cleanup(path: str | None) -> None:
    """Delete temp file if it exists — called on rollback (design p.11)."""
    if path and os.path.exists(path):
        try:
            os.remove(path)
            logger.info("Cleaned up orphaned file: %s", path)
        except OSError as e:
            logger.error("Failed to clean up file %s: %s", path, e)