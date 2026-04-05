"""
tests/test_extraction.py
Tests: POST /api/extract/, GET /api/jobs/{id}/, Celery task logic.
"""
import json
import uuid
from unittest.mock import MagicMock, patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Connection, ExtractionJob, User


def make_user(username, role="user"):
    return User.objects.create_user(username=username, password="pass", role=role)


def make_connection(owner):
    return Connection.objects.create(
        name="Test PG", db_type="postgres",
        config={"host": "h", "port": 5432, "user": "u", "password": "p", "database": "d"},
        status=Connection.STATUS_HEALTHY,
        owner=owner,
    )


def make_job(owner, connection, job_status=ExtractionJob.STATUS_PENDING):
    return ExtractionJob.objects.create(
        connection=connection,
        owner=owner,
        batch_size=100,
        query_metadata={"query": "SELECT * FROM inventory_items"},
        status=job_status,
    )


class ExtractViewTests(APITestCase):

    def setUp(self):
        self.user = make_user("alice")
        self.conn = make_connection(self.user)

    @patch("api.views.extraction.run_extraction.delay")
    def test_returns_job_id_immediately(self, mock_delay):
        self.client.force_authenticate(self.user)
        res = self.client.post(reverse("extract"), {
            "connection_id": str(self.conn.id),
            "query": "SELECT * FROM inventory_items",
            "batch_size": 100,
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn("job_id", res.data)
        self.assertEqual(res.data["status"], "PENDING")
        mock_delay.assert_called_once()

    @patch("api.views.extraction.run_extraction.delay")
    def test_batch_size_capped_at_max(self, _):
        self.client.force_authenticate(self.user)
        res = self.client.post(reverse("extract"), {
            "connection_id": str(self.conn.id),
            "query": "SELECT 1",
            "batch_size": 99999,
        }, format="json")
        # Serializer max_value=10_000 should reject this
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_extract_from_other_users_connection(self):
        other = make_user("bob")
        self.client.force_authenticate(other)
        res = self.client.post(reverse("extract"), {
            "connection_id": str(self.conn.id),
            "query": "SELECT 1",
            "batch_size": 10,
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_returns_401(self):
        res = self.client.post(reverse("extract"), {})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class JobDetailViewTests(APITestCase):

    def setUp(self):
        self.user = make_user("carol")
        self.conn = make_connection(self.user)

    def test_pending_job_returns_status(self):
        job = make_job(self.user, self.conn)
        self.client.force_authenticate(self.user)
        res = self.client.get(reverse("job-detail", kwargs={"pk": job.job_id}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "PENDING")

    @patch("api.views.extraction.cache.get")
    def test_success_job_returns_rows(self, mock_cache):
        rows = [{"id": 1, "sku": "SKU-001"}]
        mock_cache.return_value = json.dumps(rows)
        job = make_job(self.user, self.conn, ExtractionJob.STATUS_SUCCESS)
        self.client.force_authenticate(self.user)
        res = self.client.get(reverse("job-detail", kwargs={"pk": job.job_id}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["rows"], rows)
        self.assertEqual(res.data["progress"], 100)

    def test_other_user_cannot_see_job(self):
        other = make_user("dave")
        job = make_job(self.user, self.conn)
        self.client.force_authenticate(other)
        res = self.client.get(reverse("job-detail", kwargs={"pk": job.job_id}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_nonexistent_job_returns_404(self):
        self.client.force_authenticate(self.user)
        res = self.client.get(reverse("job-detail", kwargs={"pk": uuid.uuid4()}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class ExtractionTaskTests(APITestCase):
    """
    Unit tests for the Celery task logic — connector mocked, no live DB.
    """

    def setUp(self):
        self.user = make_user("eve")
        self.conn = make_connection(self.user)

    @patch("tasks.extraction.ConnectorFactory.get")
    @patch("tasks.extraction.cache.set")
    def test_task_marks_success_and_caches_result(self, mock_cache_set, mock_factory):
        job = make_job(self.user, self.conn)

        # Mock connector yields 2 chunks of 5 rows each
        rows = [{"id": i, "val": f"v{i}"} for i in range(10)]
        mock_connector = MagicMock()
        mock_connector.__enter__ = MagicMock(return_value=mock_connector)
        mock_connector.__exit__ = MagicMock(return_value=False)
        mock_connector.fetch_chunks.return_value = iter([rows[:5], rows[5:]])
        mock_factory.return_value = mock_connector

        from tasks.extraction import run_extraction
        result = run_extraction(str(job.job_id))

        job.refresh_from_db()
        self.assertEqual(result["status"], "SUCCESS")
        self.assertEqual(result["row_count"], 10)
        self.assertEqual(job.status, ExtractionJob.STATUS_SUCCESS)
        self.assertEqual(len(job.result_preview), 10)
        mock_cache_set.assert_called()

    @patch("tasks.extraction.ConnectorFactory.get")
    def test_task_marks_failed_on_connection_error(self, mock_factory):
        from api.exceptions import ConnectionError as DCPErr
        mock_factory.side_effect = DCPErr("Source unreachable")
        job = make_job(self.user, self.conn)

        from tasks.extraction import run_extraction
        result = run_extraction(str(job.job_id))

        job.refresh_from_db()
        self.assertEqual(result["status"], "FAILED")
        self.assertEqual(job.status, ExtractionJob.STATUS_FAILED)
        self.assertIn("unreachable", job.error_message)

    def test_task_fails_gracefully_on_missing_job(self):
        from tasks.extraction import run_extraction
        result = run_extraction(str(uuid.uuid4()))
        self.assertEqual(result["status"], "FAILED")