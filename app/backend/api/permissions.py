"""
DCP-06 | api/permissions.py
RBAC permission classes (design p.12 — "User vs Admin" model).
Used by file download gatekeeper in DCP-12.
"""
from rest_framework.permissions import BasePermission
from .models import User as AppUser

def _get_app_user(request) -> AppUser | None:
    if request.user and request.user.is_authenticated:
        return request.user  # type: ignore[return-value]
    return None

class IsAdmin(BasePermission):
    """Grants access only to users with role=admin."""
    def has_permission(self, request, view):
        user = _get_app_user(request)
        return bool(user and user.is_admin)


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission.
    Admin: unrestricted access to all objects (design p.12).
    User: access only if obj.owner == request.user.
    """
    def has_object_permission(self, request, view, obj):
        user = _get_app_user(request)
        if not user:
            return False
        if user.is_admin:
            return True
        return getattr(obj, "owner", None) == user


class IsFileAccessible(BasePermission):
    """
    Gatekeeper for FileMetadata downloads (design p.12).
    Access granted if:
      1. request.user is admin, OR
      2. file.owner == request.user, OR
      3. user appears in FileAccessControl for this file.
    Returns 403 Forbidden otherwise — files are never public (design p.12).
    """
    def has_object_permission(self, request, view, obj):
        user = _get_app_user(request)
        if not user:
            return False
        if user.is_admin:
            return True
        if obj.owner == user:
            return True
        return obj.access_grants.filter(user=user).exists()