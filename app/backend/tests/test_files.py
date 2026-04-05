"""
tests/test_files.py
Tests: list, download RBAC (admin/owner/shared/forbidden), share endpoint.
Design ref: p.12 — the three-step gatekeeper.
"""
import os
import uuid

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Connection, ExtractionJob, FileAccessControl, FileMetadata, User

TMP_STORAGE = "/tmp/dcp_test_storage"


def make_user(username, role="user"):
    return User.objects.create_user(username=username, password="pass", role=role)


def make_connection(owner):
    return Connection.objects.create(
        name="PG", db_type="postgres",
        config={"host": "h", "port": 5432, "user": "u", "password": "p", "database": "d"},
        status=Connection.STATUS_HEALTHY, owner=owner,
    )


def make_job(owner, conn):
    return ExtractionJob.objects.create(
        connection=conn, owner=owner, batch_size=10,
        query_metadata={"query": "SELECT 1"},
        status=ExtractionJob.STATUS_SUCCESS,
    )


def make_file(owner, job, storage_root=TMP_STORAGE) -> FileMetadata:
    os.makedirs(storage_root, exist_ok=True)
    file_id   = uuid.uuid4()
    file_path = os.path.join(storage_root, f"{file_id}.json")
    with open(file_path, "w") as f:
        f.write('{"_metadata": {}, "data": []}')
    return FileMetadata.objects.create(
        file_id=file_id, file_path=file_path, format="json",
        owner=owner, job=job,
        source_metadata={"source_db": "PG"},
        checksum="abc123",
    )


class FilesListTests(APITestCase):

    def setUp(self):
        self.owner = make_user("owner")
        self.other = make_user("other")
        self.admin = make_user("admin", role="admin")
        conn       = make_connection(self.owner)
        job        = make_job(self.owner, conn)
        self.file  = make_file(self.owner, job)

    def tearDown(self):
        if os.path.exists(self.file.file_path):
            os.remove(self.file.file_path)

    def test_owner_sees_own_files(self):
        self.client.force_authenticate(self.owner)
        res = self.client.get(reverse("files-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_other_user_sees_no_files(self):
        self.client.force_authenticate(self.other)
        res = self.client.get(reverse("files-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_admin_sees_all_files(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get(reverse("files-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_shared_file_visible_to_grantee(self):
        FileAccessControl.objects.create(
            file_metadata=self.file, user=self.other,
            access_level=FileAccessControl.ACCESS_VIEWER,
            granted_by=self.owner,
        )
        self.client.force_authenticate(self.other)
        res = self.client.get(reverse("files-list"))
        self.assertEqual(len(res.data), 1)


class FileDownloadTests(APITestCase):

    def setUp(self):
        self.owner = make_user("dl_owner")
        self.other = make_user("dl_other")
        self.admin = make_user("dl_admin", role="admin")
        conn       = make_connection(self.owner)
        job        = make_job(self.owner, conn)
        self.file  = make_file(self.owner, job)

    def tearDown(self):
        if os.path.exists(self.file.file_path):
            os.remove(self.file.file_path)

    def _url(self):
        return reverse("file-download", kwargs={"pk": self.file.file_id})

    def test_owner_can_download(self):
        self.client.force_authenticate(self.owner)
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res["Content-Type"], "application/json")

    def test_admin_can_download_any_file(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unrelated_user_gets_403(self):
        """Core RBAC test — design p.12 / p.23."""
        self.client.force_authenticate(self.other)
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_shared_user_can_download(self):
        FileAccessControl.objects.create(
            file_metadata=self.file, user=self.other,
            access_level=FileAccessControl.ACCESS_DOWNLOADER,
            granted_by=self.owner,
        )
        self.client.force_authenticate(self.other)
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_gets_401(self):
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_file_id_returns_404(self):
        self.client.force_authenticate(self.owner)
        res = self.client.get(
            reverse("file-download", kwargs={"pk": uuid.uuid4()})
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_missing_file_on_disk_returns_410(self):
        os.remove(self.file.file_path)
        self.client.force_authenticate(self.owner)
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_410_GONE)


class FileShareTests(APITestCase):

    def setUp(self):
        self.owner = make_user("sh_owner")
        self.other = make_user("sh_other")
        conn       = make_connection(self.owner)
        job        = make_job(self.owner, conn)
        self.file  = make_file(self.owner, job)

    def tearDown(self):
        if os.path.exists(self.file.file_path):
            os.remove(self.file.file_path)

    def _url(self):
        return reverse("file-share", kwargs={"pk": self.file.file_id})

    def test_owner_can_share(self):
        self.client.force_authenticate(self.owner)
        res = self.client.post(self._url(), {
            "user_id": str(self.other.id),
            "access_level": "DOWNLOADER",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            FileAccessControl.objects.filter(
                file_metadata=self.file, user=self.other
            ).exists()
        )

    def test_non_owner_cannot_share(self):
        stranger = make_user("stranger")
        self.client.force_authenticate(stranger)
        res = self.client.post(self._url(), {
            "user_id": str(self.other.id),
            "access_level": "VIEWER",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)