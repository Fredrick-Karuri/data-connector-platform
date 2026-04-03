"""
DCP-11 | tests/test_submission.py
Tests: dual storage write, atomic rollback on file failure, diff computation.
Design ref: p.10-11, p.23 (atomic transaction test case)
"""
import json
import os
import uuid
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Connection, ExtractionJob, FileMetadata, ProcessedRecord, User
from services.submission import SubmissionService

TMP_STORAGE = "/tmp/dcp_test_storage"


def make_user(username, role="user"):
    return User.objects.create_user(username=username, password="pass", role=role)


def make_connection(owner):
    return Connection.objects.create(
        name="PG", db_type="postgres",
        config={"host": "h", "port": 5432, "user": "u", "password": "p", "database": "d"},
        status=Connection.STATUS_HEALTHY, owner=owner,
    )


def make_success_job(owner, connection):
    return ExtractionJob.objects.create(
        connection=connection, owner=owner, batch_size=10,
        query_metadata={"query": "SELECT * FROM t"},
        status=ExtractionJob.STATUS_SUCCESS,
    )


ORIGINAL = [{"id": 1, "name": "Widget", "price": 9.99}]
MODIFIED = [{"id": 1, "name": "Widget Pro", "price": 14.99}]


class SubmissionServiceTests(APITestCase):

    def setUp(self):
        self.user = make_user("alice")
        self.conn = make_connection(self.user)
        self.job  = make_success_job(self.user, self.conn)

    @override_settings(STORAGE_ROOT=TMP_STORAGE)
    def test_json_file_created_and_metadata_saved(self):
        meta = SubmissionService.execute(
            str(self.job.job_id), ORIGINAL, MODIFIED, "json", self.user
        )
        self.assertIsInstance(meta, FileMetadata)
        self.assertTrue(os.path.exists(meta.file_path))
        with open(meta.file_path) as f:
            payload = json.load(f)
        self.assertIn("_metadata", payload)
        self.assertEqual(payload["data"], MODIFIED)
        os.remove(meta.file_path)

    @override_settings(STORAGE_ROOT=TMP_STORAGE)
    def test_csv_file_created(self):
        meta = SubmissionService.execute(
            str(self.job.job_id), ORIGINAL, MODIFIED, "csv", self.user
        )
        self.assertTrue(os.path.exists(meta.file_path))
        with open(meta.file_path) as f:
            content = f.read()
        self.assertIn("Widget Pro", content)
        self.assertIn("# source_db_id", content)
        os.remove(meta.file_path)

    @override_settings(STORAGE_ROOT=TMP_STORAGE)
    def test_checksum_is_sha256(self):
        meta = SubmissionService.execute(
            str(self.job.job_id), ORIGINAL, MODIFIED, "json", self.user
        )
        self.assertEqual(len(meta.checksum), 64)
        os.remove(meta.file_path)

    @override_settings(STORAGE_ROOT=TMP_STORAGE)
    def test_processed_records_saved(self):
        SubmissionService.execute(
            str(self.job.job_id), ORIGINAL, MODIFIED, "json", self.user
        )
        records = ProcessedRecord.objects.filter(job=self.job)
        self.assertEqual(records.count(), 1)
        first = records.first()
        assert first is not None
        self.assertEqual(first.data["name"], "Widget Pro")
        # cleanup
        FileMetadata.objects.filter(job=self.job).delete()

    @override_settings(STORAGE_ROOT=TMP_STORAGE)
    def test_atomic_rollback_on_file_write_failure(self):
        """
        Key test from design p.23: if file write fails, DB record must be rolled back.
        No FileMetadata or ProcessedRecord should exist after the failure.
        """
        with patch("services.submission.SubmissionService._write_file",
                   side_effect=OSError("Disk full")):
            from api.exceptions import PersistenceError
            with self.assertRaises(PersistenceError):
                SubmissionService.execute(
                    str(self.job.job_id), ORIGINAL, MODIFIED, "json", self.user
                )

        # DB must be clean — no phantom records
        self.assertEqual(ProcessedRecord.objects.filter(job=self.job).count(), 0)
        self.assertEqual(FileMetadata.objects.filter(job=self.job).count(), 0)

    def test_fails_for_non_success_job(self):
        pending_job = ExtractionJob.objects.create(
            connection=self.conn, owner=self.user, batch_size=10,
            query_metadata={"query": "SELECT 1"},
            status=ExtractionJob.STATUS_PENDING,
        )
        from api.exceptions import PersistenceError
        with self.assertRaises(PersistenceError):
            SubmissionService.execute(
                str(pending_job.job_id), ORIGINAL, MODIFIED, "json", self.user
            )


class SubmitBatchViewTests(APITestCase):

    def setUp(self):
        self.user = make_user("bob")
        self.conn = make_connection(self.user)
        self.job  = make_success_job(self.user, self.conn)

    @override_settings(STORAGE_ROOT=TMP_STORAGE)
    def test_submit_returns_file_id(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(reverse("submit-batch"), {
            "job_id":        str(self.job.job_id),
            "original_data": ORIGINAL,
            "modified_data": MODIFIED,
            "format":        "json",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("file_id", res.data)
        self.assertIn("checksum", res.data)
        # cleanup
        meta = FileMetadata.objects.get(file_id=res.data["file_id"])
        if os.path.exists(meta.file_path):
            os.remove(meta.file_path)

    def test_unauthenticated_returns_401(self):
        res = self.client.post(reverse("submit-batch"), {})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_format_returns_400(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(reverse("submit-batch"), {
            "job_id":        str(self.job.job_id),
            "original_data": ORIGINAL,
            "modified_data": MODIFIED,
            "format":        "xml",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_schema_drift_returns_400(self):
        """modified_data introduces a column not in original_data → rejected."""
        self.client.force_authenticate(self.user)
        res = self.client.post(reverse("submit-batch"), {
            "job_id":        str(self.job.job_id),
            "original_data": ORIGINAL,
            "modified_data": [{"id": 1, "name": "x", "price": 1.0, "hacked_field": "💀"}],
            "format":        "json",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)