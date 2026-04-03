"""
DCP-12 | api/views/files.py
GET /api/files/                  — list files accessible to current user
GET /api/files/{id}/download/    — RBAC gatekeeper + stream via FileResponse
POST /api/files/{id}/share/      — grant access to another user
Design ref: p.11-12 — files never public, UUID filenames, FileResponse streaming
"""
import logging
import os

from django.http import FileResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import FileAccessControl, FileMetadata, User
from api.permissions import IsAdmin
from api.serializers import FileAccessControlSerializer, FileMetadataSerializer

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def files_list(request):
    """
    GET /api/files/
    Returns files where user is owner OR has an access grant (design p.12).
    Admins see all files.
    """
    if request.user.is_admin:
        qs = FileMetadata.objects.select_related("owner", "job").all()
    else:
        # Own files + shared files
        shared_ids = FileAccessControl.objects.filter(
            user=request.user
        ).values_list("file_metadata_id", flat=True)

        qs = FileMetadata.objects.select_related("owner", "job").filter(
            owner=request.user
        ) | FileMetadata.objects.filter(file_id__in=shared_ids)

    qs = qs.order_by("-created_at")
    return Response(FileMetadataSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def file_download(request, pk):
    """
    GET /api/files/{id}/download/
    Multi-step RBAC check before streaming (design p.12):
      1. Lookup FileMetadata
      2. Check admin → owner → shared_with[]
      3. Stream via FileResponse in chunks — never a public URL
    Returns 403 Forbidden for any unauthorised access.
    """
    try:
        file_meta = FileMetadata.objects.select_related("owner").get(file_id=pk)
    except FileMetadata.DoesNotExist:
        return Response({"detail": "File not found."}, status=status.HTTP_404_NOT_FOUND)

    # ── RBAC gatekeeper (design p.12) ─────────────────────────────────────────
    if not _is_authorised(request.user, file_meta):
        logger.warning(
            "Unauthorised file access: user=%s file=%s", request.user.id, pk
        )
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    # ── File integrity check ──────────────────────────────────────────────────
    if not os.path.exists(file_meta.file_path):
        logger.error("File missing on disk: %s", file_meta.file_path)
        return Response(
            {"detail": "File unavailable — contact an administrator."},
            status=status.HTTP_410_GONE,
        )

    # ── Stream file in chunks (design p.12 — minimise memory on backend) ──────
    content_types = {
        "csv":  "text/csv",
        "json": "application/json",
    }
    filename = f"export_{file_meta.file_id}.{file_meta.format}"

    response = FileResponse(
        open(file_meta.file_path, "rb"),
        content_type=content_types.get(file_meta.format, "application/octet-stream"),
        as_attachment=True,
        filename=filename,
    )
    logger.info("File download: user=%s file=%s", request.user.id, pk)
    return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def file_share(request, pk):
    """
    POST /api/files/{id}/share/
    Body: { user_id, access_level }
    Only the file owner or an admin can share (design p.12).
    """
    try:
        file_meta = FileMetadata.objects.get(file_id=pk)
    except FileMetadata.DoesNotExist:
        return Response({"detail": "File not found."}, status=status.HTTP_404_NOT_FOUND)

    if not request.user.is_admin and file_meta.owner != request.user:
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = User.objects.get(id=request.data.get("user_id"))
    except User.DoesNotExist:
        return Response({"detail": "Target user not found."}, status=status.HTTP_404_NOT_FOUND)

    access_level = request.data.get("access_level", FileAccessControl.ACCESS_DOWNLOADER)
    if access_level not in (FileAccessControl.ACCESS_VIEWER, FileAccessControl.ACCESS_DOWNLOADER):
        return Response({"detail": "Invalid access_level."}, status=status.HTTP_400_BAD_REQUEST)

    grant, created = FileAccessControl.objects.get_or_create(
        file_metadata=file_meta,
        user=target_user,
        defaults={"access_level": access_level, "granted_by": request.user},
    )
    if not created:
        grant.access_level = access_level
        grant.save(update_fields=["access_level"])

    return Response(
        FileAccessControlSerializer(grant).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_files_list(request):
    """
    GET /api/admin/files/
    Admin-only: full list with source metadata for monitoring (design p.12).
    """
    qs = FileMetadata.objects.select_related("owner", "job").order_by("-created_at")
    return Response(FileMetadataSerializer(qs, many=True).data)


# ── Helper ────────────────────────────────────────────────────────────────────

def _is_authorised(user, file_meta: FileMetadata) -> bool:
    """
    Three-step check from design p.12:
      1. Admin → always granted
      2. Owner → granted
      3. shared_with[] via FileAccessControl → granted
    """
    if user.is_admin:
        return True
    if file_meta.owner == user:
        return True
    return FileAccessControl.objects.filter(
        file_metadata=file_meta, user=user
    ).exists()