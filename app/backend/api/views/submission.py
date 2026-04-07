"""
api/views/submission.py
POST /api/submit-batch/ — triggers dual storage via SubmissionService.
Design ref: p.10-11, p.20
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.exceptions import PersistenceError
from api.serializers import FileMetadataSerializer, SubmitBatchSerializer
from services.submission import SubmissionService
from core.logging import get_logger
logger = get_logger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_batch(request):
    """
    POST /api/submit-batch/
    Body: { job_id, original_data, modified_data, format }

    Validates diff map → writes ProcessedRecords → generates file → creates FileMetadata.
    All inside transaction.atomic(). Returns file_id on success (design p.10-11).
    """
    serializer = SubmitBatchSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        file_meta = SubmissionService.execute(
            job_id        = str(serializer.validated_data["job_id"]),
            original_data = serializer.validated_data["original_data"],
            modified_data = serializer.validated_data["modified_data"],
            file_format   = serializer.validated_data["format"],
            user          = request.user,
        )
        return Response(
            {
                "file_id": str(file_meta.file_id),
                "format":  file_meta.format,
                "checksum": file_meta.checksum,
                **FileMetadataSerializer(file_meta).data,
            },
            status=status.HTTP_201_CREATED,
        )

    except PersistenceError as exc:
        return Response(
            {"code": "PersistenceError", "detail": str(exc.detail)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )