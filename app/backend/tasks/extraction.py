"""
tasks/extraction.py
Celery task: picks up extraction jobs, streams data in chunks,
caches result in Redis for the frontend to poll.
Design ref: p.6-7 (async task), p.21 (circuit breaker — 60s limit, 3 retries, exponential backoff)
"""
import json

from celery import shared_task
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from api.exceptions import ConnectionError as DCPConnectionError, ExtractionError
from api.models import ExtractionJob
from connectors.factory import ConnectorFactory

from core.logging import get_logger
logger = get_logger(__name__)


PREVIEW_ROWS = 10           # Rows stored on job for grid init
REDIS_TTL    = 60 * 60 * 2  # Cache result for 2 hours


@shared_task(
    bind=True,
    max_retries=3,
    time_limit=60,          # Hard kill at 60s (design p.21)
    soft_time_limit=55,     # Graceful shutdown at 55s
    name="tasks.run_extraction",
)
def run_extraction(self, job_id: str) -> dict:
    """
    1. Load ExtractionJob from DB
    2. Open connector via ConnectorFactory
    3. Stream rows in BATCH_CHUNK_SIZE sub-batches
    4. Cache full result in Redis — key: job:{job_id}:result
    5. Update job status throughout
    """
    job = _get_job(job_id)
    if job is None:
        logger.error("run_extraction: job %s not found", job_id)
        return {"status": "FAILED", "error": "Job not found"}

    _mark_progress(job)

    connection  = job.connection
    query       = job.query_metadata.get("query", "")
    batch_size  = min(job.batch_size, settings.BATCH_MAX_ROWS)
    chunk_size  = settings.BATCH_CHUNK_SIZE

    all_rows   = []
    row_count  = 0

    try:
        connector = ConnectorFactory.get(connection.db_type, connection.config)

        with connector:
            for chunk in connector.fetch_chunks(query, batch_size, chunk_size):
                all_rows.extend(chunk)
                row_count += len(chunk)

                # Update progress percentage in Redis so the frontend can show it
                progress = min(int((row_count / batch_size) * 100), 99)
                _set_progress_cache(job_id, progress)

                if row_count >= batch_size:
                    break

        # Store full result in Redis (design p.7 — high-speed buffer)
        cache_key = f"job:{job_id}:result"
        cache.set(cache_key, json.dumps(all_rows, default=str), timeout=REDIS_TTL)

        # Store preview on the job model for quick grid init without Redis round-trip
        preview = all_rows[:PREVIEW_ROWS]
        job.result_preview = preview
        job.status         = ExtractionJob.STATUS_SUCCESS
        job.completed_at   = timezone.now()
        job.save(update_fields=["status", "result_preview", "completed_at"])

        logger.info("run_extraction: job %s completed — %d rows", job_id, row_count)
        return {"status": "SUCCESS", "row_count": row_count}

    except (DCPConnectionError, ExtractionError) as exc:
        # Known domain errors — don't retry, fail immediately
        _mark_failed(job, str(exc))
        return {"status": "FAILED", "error": str(exc)}

    except Exception as exc:
        # Unknown errors — retry with exponential backoff (design p.21)
        logger.warning(
            "run_extraction: job %s failed (attempt %d): %s",
            job_id, self.request.retries + 1, exc,
        )
        try:
            raise self.retry(
                exc=exc,
                countdown=2 ** self.request.retries,  # 1s, 2s, 4s
            )
        except self.MaxRetriesExceededError:
            _mark_failed(job, f"Max retries exceeded: {exc}")
            return {"status": "FAILED", "error": str(exc)}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_job(job_id: str) -> ExtractionJob | None:
    try:
        return (
            ExtractionJob.objects
            .select_related("connection")
            .get(job_id=job_id)
        )
    except ExtractionJob.DoesNotExist:
        return None


def _mark_progress(job: ExtractionJob) -> None:
    job.status     = ExtractionJob.STATUS_PROGRESS
    job.started_at = timezone.now()
    job.save(update_fields=["status", "started_at"])


def _mark_failed(job: ExtractionJob, error: str) -> None:
    job.status        = ExtractionJob.STATUS_FAILED
    job.error_message = error
    job.completed_at  = timezone.now()
    job.save(update_fields=["status", "error_message", "completed_at"])
    logger.error("run_extraction: job %s FAILED — %s", job.job_id, error)


def _set_progress_cache(job_id: str, pct: int) -> None:
    cache.set(f"job:{job_id}:progress", pct, timeout=REDIS_TTL)