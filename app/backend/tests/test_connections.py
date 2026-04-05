"""
tests/test_connections.py
Tests: list, create, test-only, retest, RBAC enforcement.
"""
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import User, Connection


def make_user(username, role="user"):
    return User.objects.create_user(username=username, password="pass", role=role)


def make_connection(owner, db_type="postgres"):
    return Connection.objects.create(
        name=f"Test {db_type}",
        db_type=db_type,
        config={"host": "localhost", "port": 5432, "user": "u", "password": "p", "database": "d"},
        status=Connection.STATUS_HEALTHY,
        owner=owner,
    )


class ConnectionListCreateTests(APITestCase):

    def setUp(self):
        self.user  = make_user("alice")
        self.admin = make_user("admin_user", role="admin")
        self.conn  = make_connection(self.user)

    def test_list_returns_only_own_connections_for_user(self):
        other = make_user("bob")
        make_connection(other)
        self.client.force_authenticate(self.user)
        res = self.client.get(reverse("connections-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], self.conn.name)

    def test_admin_sees_all_connections(self):
        other = make_user("carol")
        make_connection(other)
        self.client.force_authenticate(self.admin)
        res = self.client.get(reverse("connections-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 2)

    def test_unauthenticated_returns_401(self):
        res = self.client.get(reverse("connections-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("api.views.connections.ConnectorFactory.test", return_value=True)
    def test_create_connection_healthy(self, mock_test):
        self.client.force_authenticate(self.user)
        payload = {
            "name": "New PG",
            "db_type": "postgres",
            "config": {"host": "db", "port": 5432, "user": "u", "password": "p", "database": "d"},
        }
        res = self.client.post(reverse("connections-list"), payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "Healthy")
        mock_test.assert_called_once()

    @patch("api.views.connections.ConnectorFactory.test", side_effect=Exception("unreachable"))
    def test_create_connection_saves_as_offline_on_failure(self, mock_test):
        self.client.force_authenticate(self.user)
        payload = {
            "name": "Bad PG",
            "db_type": "postgres",
            "config": {"host": "bad", "port": 5432, "user": "u", "password": "p", "database": "d"},
        }
        res = self.client.post(reverse("connections-list"), payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "Offline")


class ConnectionTestEndpointTests(APITestCase):

    def setUp(self):
        self.user = make_user("dave")

    @patch("api.views.connections.ConnectorFactory.test", return_value=True)
    def test_healthy_returns_200(self, _):
        self.client.force_authenticate(self.user)
        payload = {
            "name": "x", "db_type": "postgres",
            "config": {"host": "h", "port": 5432, "user": "u", "password": "p", "database": "d"},
        }
        res = self.client.post(reverse("connection-test"), payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "Healthy")

    @patch("api.views.connections.ConnectorFactory.test")
    def test_offline_returns_400(self, mock_test):
        from api.exceptions import ConnectionError as DCPErr
        mock_test.side_effect = DCPErr("Source unreachable")
        self.client.force_authenticate(self.user)
        payload = {
            "name": "x", "db_type": "mysql",
            "config": {"host": "bad", "port": 3306, "user": "u", "password": "p", "database": "d"},
        }
        res = self.client.post(reverse("connection-test"), payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["status"], "Offline")


class ConnectionRBACTests(APITestCase):

    def setUp(self):
        self.owner = make_user("owner")
        self.other = make_user("other")
        self.conn  = make_connection(self.owner)

    def test_non_owner_cannot_delete(self):
        self.client.force_authenticate(self.other)
        res = self.client.delete(
            reverse("connection-detail", kwargs={"pk": self.conn.id})
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_delete(self):
        self.client.force_authenticate(self.owner)
        res = self.client.delete(
            reverse("connection-detail", kwargs={"pk": self.conn.id})
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)