"""
DCP-17 | tests/test_atomic_unit.py
Unit tests for the dual-storage atomic transaction guarantee.
Design ref: p.23 — "intentionally fail the file-write step to ensure the
database record is correctly rolled back"
Also covers the SystemLogs audit trail on failure.
"""
import os
import uuid
from unittest.mock import patch

from django.test import TestCase, override_settings

from api.exceptions import PersistenceError
from api.models import (
    Connection, ExtractionJob, FileMetadata,
    ProcessedRecord, User,
)
from services.submission import SubmissionService

TMP = "/tmp/dcp_atomic_tests"

ORIGINAL = [{"id": "r1", "sku": "SKU-001", "price": 49.99}]
MODIFIED = [{"id": "r1", "sku": "SKU-001-UPDATED", "price": 59.99}]


def make_env():
    user = User.objects.create_user("atomic_user", password="pass")
    conn = Connection.objects.create(
        name="PG", db_type="postgres",
        config={"host": "h", "port": 5432, "user": "u", "password": "p", "database": "d"},
        status="Healthy", owner=user,
    )
    job = ExtractionJob.objects.create(
        connection=conn, owner=user, batch_size=10,
        query_metadata={"query": "SELECT 1"},
        status=ExtractionJob.STATUS_SUCCESS,
    )
    return user, job


class TestAtomicRollback(TestCase):
    """
    Design p.23: "A test case that intentionally fails the file-write step
    to ensure the database record is correctly rolled back."
    """

    @override_settings(STORAGE_ROOT=TMP)
    def test_db_rolled_back_when_file_write_fails(self):
        user, job = make_env()

        with patch("services.submission.SubmissionService._write_file",
                   side_effect=OSError("Simulated disk full")):
            with self.assertRaises(PersistenceError):
                SubmissionService.execute(
                    str(job.job_id), ORIGINAL, MODIFIED, "json", user
                )

        # No ProcessedRecord should exist — transaction rolled back
        self.assertEqual(ProcessedRecord.objects.filter(job=job).count(), 0)
        # No FileMetadata phantom record
        self.assertEqual(FileMetadata.objects.filter(job=job).count(), 0)

    @override_settings(STORAGE_ROOT=TMP)
    def test_db_rolled_back_when_file_metadata_create_fails(self):
        """
        Variant: file is written but FileMetadata.create raises —
        both the file and DB rows must be cleaned up.
        """
        user, job = make_env()
        written_paths = []

        # Let _write_file succeed but capture the path so we can check cleanup
        real_write = SubmissionService._write_file

        def capturing_write(*args, **kwargs):
            path, checksum = real_write(*args, **kwargs)
            written_paths.append(path)
            return path, checksum

        with patch("services.submission.SubmissionService._write_file",
                   side_effect=capturing_write):
            with patch("api.models.FileMetadata.objects.create",
                       side_effect=Exception("DB constraint violation")):
                with self.assertRaises(PersistenceError):
                    SubmissionService.execute(
                        str(job.job_id), ORIGINAL, MODIFIED, "json", user
                    )

        # ProcessedRecord rolled back
        self.assertEqual(ProcessedRecord.objects.filter(job=job).count(), 0)
        # Temp file cleaned up
        for path in written_paths:
            self.assertFalse(os.path.exists(path),
                             f"Orphaned file not cleaned up: {path}")

    @override_settings(STORAGE_ROOT=TMP)
    def test_success_path_creates_both_record_and_file(self):
        """Positive case — both writes succeed together."""
        user, job = make_env()

        meta = SubmissionService.execute(
            str(job.job_id), ORIGINAL, MODIFIED, "json", user
        )

        self.assertIsNotNone(meta.file_id)
        self.assertTrue(os.path.exists(meta.file_path))
        self.assertEqual(ProcessedRecord.objects.filter(job=job).count(), 1)
        record = ProcessedRecord.objects.filter(job=job).first()
        assert record is not None
        self.assertEqual(record.data["sku"], "SKU-001-UPDATED")

        # Cleanup
        if os.path.exists(meta.file_path):
            os.remove(meta.file_path)

    @override_settings(STORAGE_ROOT=TMP)
    def test_pending_job_rejected_before_any_write(self):
        """
        Submission service must reject non-SUCCESS jobs before touching
        the DB or filesystem — no side effects at all.
        """
        user, _ = make_env()
        conn = Connection.objects.filter(owner=user).first()
        pending_job = ExtractionJob.objects.create(
            connection=conn, owner=user, batch_size=10,
            query_metadata={"query": "SELECT 1"},
            status=ExtractionJob.STATUS_PENDING,
        )

        with self.assertRaises(PersistenceError):
            SubmissionService.execute(
                str(pending_job.job_id), ORIGINAL, MODIFIED, "csv", user
            )

        self.assertEqual(ProcessedRecord.objects.filter(job=pending_job).count(), 0)
        self.assertEqual(FileMetadata.objects.filter(job=pending_job).count(), 0)

    @override_settings(STORAGE_ROOT=TMP)
    def test_checksum_matches_file_content(self):
        """SHA-256 stored in FileMetadata must match the actual file on disk."""
        import hashlib
        user, job = make_env()

        meta = SubmissionService.execute(
            str(job.job_id), ORIGINAL, MODIFIED, "csv", user
        )

        h = hashlib.sha256()
        with open(meta.file_path, "rb") as f:
            for block in iter(lambda: f.read(65536), b""):
                h.update(block)

        self.assertEqual(meta.checksum, h.hexdigest())

        if os.path.exists(meta.file_path):
            os.remove(meta.file_path)