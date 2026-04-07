"""
api/views/extraction.py
POST /api/extract/        — enqueue Celery task, return job_id immediately
GET  /api/jobs/{job_id}/  — poll status + retrieve result once SUCCESS
Design ref: p.6-7, p.20
"""
import json


from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.exceptions import ExtractionError
from api.models import Connection, ExtractionJob
from api.serializers import ExtractRequestSerializer, ExtractionJobSerializer
from tasks.extraction import run_extraction
from core.logging import get_logger
logger = get_logger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def extract(request):
    """
    POST /api/extract/
    Body: { connection_id, query, batch_size }
    Returns job_id immediately; Celery worker handles the rest (design p.6).
    """
    serializer = ExtractRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    connection_id = serializer.validated_data["connection_id"]
    query         = serializer.validated_data["query"]
    batch_size    = serializer.validated_data["batch_size"]

    # Ensure user owns (or is admin of) the connection
    try:
        connection = Connection.objects.get(pk=connection_id)
    except Connection.DoesNotExist:
        return Response({"detail": "Connection not found."}, status=status.HTTP_404_NOT_FOUND)

    if not request.user.is_admin and connection.owner != request.user:
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    # Create ExtractionJob record in PENDING state
    job = ExtractionJob.objects.create(
        connection=connection,
        owner=request.user,
        batch_size=min(batch_size, settings.BATCH_MAX_ROWS),
        query_metadata={"query": query},
        status=ExtractionJob.STATUS_PENDING,
    )

    # Enqueue — returns immediately with job_id (design p.6)
    run_extraction.delay(str(job.job_id)) # type: ignore[union-attr]

    return Response(
        {"job_id": str(job.job_id), "status": job.status},
        status=status.HTTP_202_ACCEPTED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def job_detail(request, pk):
    """
    GET /api/jobs/{job_id}/
    Returns job status + result rows once SUCCESS.
    Frontend polls this every 2s (pollJob in services/extraction.ts).
    Also returns live progress percentage from Redis cache.
    """
    try:
        job = ExtractionJob.objects.select_related("connection").get(job_id=pk)
    except ExtractionJob.DoesNotExist:
        return Response({"detail": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

    if not request.user.is_admin and job.owner != request.user:
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    data = ExtractionJobSerializer(job).data

    # Attach live progress percentage (0-99 during PROGRESS, 100 on SUCCESS)
    if job.status == ExtractionJob.STATUS_PROGRESS:
        data["progress"] = cache.get(f"job:{job.job_id}:progress", 0)
    elif job.status == ExtractionJob.STATUS_SUCCESS:
        data["progress"] = 100

    # Attach full result rows from Redis on SUCCESS (design p.7)
    if job.status == ExtractionJob.STATUS_SUCCESS:
        cached = cache.get(f"job:{job.job_id}:result")
        if cached:
            try:
                data["rows"] = json.loads(cached)
            except (json.JSONDecodeError, TypeError):
                raise ExtractionError("Cached result is malformed.")
        else:
            # Redis TTL expired — fall back to preview
            data["rows"] = job.result_preview or []
            data["cache_expired"] = True

    return Response(data)