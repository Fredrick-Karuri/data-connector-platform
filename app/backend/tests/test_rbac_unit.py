"""
tests/test_rbac_unit.py
Unit tests for RBAC permission classes and gatekeeper logic.
Design ref: p.23 — "User role receives 403 Forbidden when accessing
a file_id owned by another user"
"""
import uuid
from unittest.mock import MagicMock

from django.test import TestCase

from api.models import FileAccessControl, FileMetadata, User
from api.permissions import IsAdmin, IsFileAccessible, IsOwnerOrAdmin


def make_user(username, role="user"):
    return User.objects.create_user(username=username, password="pass", role=role)


def make_request(user):
    req      = MagicMock()
    req.user = user
    return req


class TestIsAdmin(TestCase):

    def test_admin_user_passes(self):
        admin = make_user("admin2", role="admin")
        perm  = IsAdmin()
        req   = MagicMock()
        req.user = admin
        # is_authenticated is a real property on User — returns True when active
        assert perm.has_permission(req, None) is True # type: ignore[arg-type]

    def test_regular_user_denied(self):
        user = make_user("alice2")
        perm = IsAdmin()
        req  = MagicMock()
        req.user = user
        assert perm.has_permission(req, None) is False # type: ignore[arg-type]


class TestIsOwnerOrAdmin(TestCase):

    def setUp(self):
        self.owner = make_user("owner")
        self.other = make_user("other")
        self.admin = make_user("admin", role="admin")

    def _make_obj(self, owner):
        obj       = MagicMock()
        obj.owner = owner
        return obj

    def test_owner_has_access(self):
        perm = IsOwnerOrAdmin()
        req  = make_request(self.owner)
        assert perm.has_object_permission(req, None, self._make_obj(self.owner)) is True # type: ignore[arg-type]

    def test_admin_has_access_to_any_object(self):
        perm = IsOwnerOrAdmin()
        req  = make_request(self.admin)
        # Admin can access object owned by someone else
        assert perm.has_object_permission(req, None, self._make_obj(self.owner)) is True # type: ignore[arg-type]

    def test_non_owner_denied(self):
        perm = IsOwnerOrAdmin()
        req  = make_request(self.other)
        assert perm.has_object_permission(req, None, self._make_obj(self.owner)) is False # type: ignore[arg-type]


class TestIsFileAccessible(TestCase):
    """
    Core RBAC gatekeeper tests — design p.12, p.23.
    Covers all three branches: admin / owner / shared_with[].
    """

    def setUp(self):
        self.owner = make_user("file_owner")
        self.other = make_user("file_other")
        self.admin = make_user("file_admin", role="admin")

        # Import after Django setup
        from api.models import Connection, ExtractionJob
        conn = Connection.objects.create(
            name="PG", db_type="postgres",
            config={"host": "h", "port": 5432, "user": "u",
                    "password": "p", "database": "d"},
            status="Healthy", owner=self.owner,
        )
        job = ExtractionJob.objects.create(
            connection=conn, owner=self.owner, batch_size=10,
            query_metadata={"query": "SELECT 1"},
            status=ExtractionJob.STATUS_SUCCESS,
        )
        self.file = FileMetadata.objects.create(
            file_id=uuid.uuid4(),
            file_path="/storage/test.json",
            format="json",
            owner=self.owner,
            job=job,
            source_metadata={},
            checksum="abc123",
        )

    def test_admin_can_access_any_file(self):
        perm = IsFileAccessible()
        req  = make_request(self.admin)
        assert perm.has_object_permission(req, None, self.file) is True # type: ignore[arg-type]

    def test_owner_can_access_own_file(self):
        perm = IsFileAccessible()
        req  = make_request(self.owner)
        assert perm.has_object_permission(req, None, self.file) is True # type: ignore[arg-type]

    def test_unrelated_user_denied(self):
        """Design p.23 — core RBAC test."""
        perm = IsFileAccessible()
        req  = make_request(self.other)
        assert perm.has_object_permission(req, None, self.file) is False # type: ignore[arg-type]

    def test_shared_user_granted_access(self):
        """Design p.12 — shared_with[] branch."""
        FileAccessControl.objects.create(
            file_metadata=self.file,
            user=self.other,
            access_level=FileAccessControl.ACCESS_DOWNLOADER,
            granted_by=self.owner,
        )
        perm = IsFileAccessible()
        req  = make_request(self.other)
        assert perm.has_object_permission(req, None, self.file) is True # type: ignore[arg-type]

    def test_viewer_grant_also_allows_access(self):
        FileAccessControl.objects.create(
            file_metadata=self.file,
            user=self.other,
            access_level=FileAccessControl.ACCESS_VIEWER,
            granted_by=self.owner,
        )
        perm = IsFileAccessible()
        req  = make_request(self.other)
        assert perm.has_object_permission(req, None, self.file) is True # type: ignore[arg-type]