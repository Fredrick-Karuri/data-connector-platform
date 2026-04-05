"""
DCP-17 | tests/test_connectors.py
Unit tests for BaseConnector implementations.
Design ref: p.23 — "each driver tested against mock DB to verify fetch_batch
returns standardised JSON"
"""
import datetime
import decimal
import uuid
from unittest.mock import MagicMock, patch, PropertyMock

import pytest

from api.exceptions import ConnectionError as DCPConnectionError, ExtractionError
from connectors.base import BaseConnector
from connectors.drivers.mongo import flatten_mongo_doc
from connectors.factory import ConnectorFactory


# ── BaseConnector._safe_value ─────────────────────────────────────────────────

class TestSafeValue:
    """Verifies the shared serialisation helper covers all DB-specific types."""

    def test_datetime_to_isoformat(self):
        dt = datetime.datetime(2024, 1, 15, 8, 0, 0)
        assert BaseConnector._safe_value(dt) == "2024-01-15T08:00:00"

    def test_date_to_isoformat(self):
        d = datetime.date(2024, 6, 1)
        assert BaseConnector._safe_value(d) == "2024-06-01"

    def test_decimal_to_float(self):
        assert BaseConnector._safe_value(decimal.Decimal("49.99")) == 49.99

    def test_uuid_to_string(self):
        u = uuid.UUID("12345678-1234-5678-1234-567812345678")
        assert BaseConnector._safe_value(u) == "12345678-1234-5678-1234-567812345678"

    def test_bytes_to_hex(self):
        assert BaseConnector._safe_value(b"\xde\xad") == "dead"

    def test_primitives_pass_through(self):
        assert BaseConnector._safe_value(42)    == 42
        assert BaseConnector._safe_value(3.14)  == 3.14
        assert BaseConnector._safe_value("hi")  == "hi"
        assert BaseConnector._safe_value(True)  is True
        assert BaseConnector._safe_value(None)  is None


# ── ConnectorFactory ──────────────────────────────────────────────────────────

class TestConnectorFactory:

    def test_returns_correct_driver_class(self):
        from connectors.drivers.postgres   import PostgresConnector
        from connectors.drivers.mysql      import MySQLConnector
        from connectors.drivers.mongo      import MongoConnector
        from connectors.drivers.clickhouse import ClickHouseConnector

        cfg = {"host": "x", "port": 1, "user": "u", "password": "p", "database": "d", "uri": "m"}
        assert isinstance(ConnectorFactory.get("postgres",   cfg), PostgresConnector)
        assert isinstance(ConnectorFactory.get("mysql",      cfg), MySQLConnector)
        assert isinstance(ConnectorFactory.get("mongodb",    cfg), MongoConnector)
        assert isinstance(ConnectorFactory.get("clickhouse", cfg), ClickHouseConnector)

    def test_unsupported_type_raises_connection_error(self):
        with pytest.raises(DCPConnectionError):
            ConnectorFactory.get("snowflake", {})

    def test_supported_types_returns_all_four(self):
        types = ConnectorFactory.supported_types()
        assert set(types) == {"postgres", "mysql", "mongodb", "clickhouse"}


# ── PostgresConnector ─────────────────────────────────────────────────────────

class TestPostgresConnector:

    @patch("connectors.drivers.postgres.psycopg2.connect")
    def test_connect_raises_connection_error_on_failure(self, mock_connect):
        mock_connect.side_effect = Exception("FATAL: password authentication failed")
        from connectors.drivers.postgres import PostgresConnector
        conn = PostgresConnector({"host": "h", "port": 5432, "user": "u",
                                   "password": "bad", "database": "d"})
        with pytest.raises(DCPConnectionError) as exc:
            conn.connect()
        assert "PostgreSQL connection failed" in str(exc.value.detail)

    @patch("connectors.drivers.postgres.psycopg2.connect")
    def test_fetch_batch_returns_normalised_dicts(self, mock_connect):
        """fetch_batch must return list[dict] with JSON-safe values (design p.23)."""
        mock_conn   = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__  = MagicMock(return_value=False)

        # Simulate rows with Decimal and datetime — must be serialised
        mock_cursor.fetchall.return_value = [
            {"id": 1, "price": decimal.Decimal("49.99"),
             "created_at": datetime.datetime(2024, 1, 15)},
        ]

        from connectors.drivers.postgres import PostgresConnector
        connector = PostgresConnector({"host": "h", "port": 5432, "user": "u",
                                        "password": "p", "database": "d"})
        connector._connection = mock_conn
        rows = connector.fetch_batch("SELECT * FROM t", batch_size=10)

        assert isinstance(rows, list)
        assert rows[0]["price"] == 49.99            # Decimal → float
        assert rows[0]["created_at"] == "2024-01-15T00:00:00"  # datetime → ISO

    @patch("connectors.drivers.postgres.psycopg2.connect")
    def test_fetch_batch_raises_extraction_error_on_bad_query(self, mock_connect):
        mock_conn   = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__ = lambda s: mock_cursor
        mock_conn.cursor.return_value.__exit__  = MagicMock(return_value=False)
        mock_cursor.execute.side_effect = Exception("syntax error")

        from connectors.drivers.postgres import PostgresConnector
        connector = PostgresConnector({"host": "h", "port": 5432, "user": "u",
                                        "password": "p", "database": "d"})
        connector._connection = mock_conn
        with pytest.raises(ExtractionError):
            connector.fetch_batch("INVALID SQL !!!", batch_size=10)


# ── MySQLConnector ────────────────────────────────────────────────────────────

class TestMySQLConnector:

    @patch("connectors.drivers.mysql.mysql.connector.connect")
    def test_connect_raises_connection_error_on_failure(self, mock_connect):
        mock_connect.side_effect = Exception("Access denied")
        from connectors.drivers.mysql import MySQLConnector
        conn = MySQLConnector({"host": "h", "port": 3306, "user": "u",
                                "password": "bad", "database": "d"})
        with pytest.raises(DCPConnectionError):
            conn.connect()

    @patch("connectors.drivers.mysql.mysql.connector.connect")
    def test_fetch_batch_returns_normalised_dicts(self, mock_connect):
        mock_conn   = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.is_connected.return_value = True
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [
            {"id": 1, "email": "a@b.com", "is_qualified": True,
             "score": decimal.Decimal("85.5")},
        ]

        from connectors.drivers.mysql import MySQLConnector
        connector = MySQLConnector({"host": "h", "port": 3306, "user": "u",
                                     "password": "p", "database": "d"})
        connector._connection = mock_conn
        rows = connector.fetch_batch("SELECT * FROM customer_leads", batch_size=10)

        assert isinstance(rows, list)
        assert rows[0]["score"] == 85.5          # Decimal → float
        assert rows[0]["is_qualified"] is True   # bool passes through


# ── MongoConnector + flatten_mongo_doc ────────────────────────────────────────

class TestMongoConnector:

    def test_connect_raises_connection_error_on_failure(self):
        from connectors.drivers.mongo import MongoConnector
        connector = MongoConnector({"uri": "mongodb://bad-host:99999/db",
                                     "database": "test"})
        with pytest.raises(DCPConnectionError):
            connector.connect()

    def test_fetch_batch_raises_extraction_error_on_bad_query_format(self):
        from connectors.drivers.mongo import MongoConnector
        connector = MongoConnector({"uri": "m", "database": "d"})
        connector._connection = MagicMock()
        connector._db = MagicMock()
        # Bad format — not collection|{filter}
        connector._db.__getitem__.return_value.find.side_effect = Exception("bad")
        with pytest.raises(ExtractionError):
            connector.fetch_batch("BAD_FORMAT|||{{{", batch_size=10)


class TestFlattenMongoDoc:
    """
    Verifies flatten_mongo_doc() produces the dot-notation tabular structure
    the grid requires. Design ref: p.9.
    """

    def test_top_level_scalars_unchanged(self):
        doc  = {"_id": "abc", "count": 5, "active": True}
        flat = flatten_mongo_doc(doc)
        assert flat["_id"]    == "abc"
        assert flat["count"]  == 5
        assert flat["active"] is True

    def test_nested_object_flattened_with_underscore(self):
        doc  = {"user": {"id": "u1", "profile": {"name": "Alice"}}}
        flat = flatten_mongo_doc(doc)
        assert flat["user_id"]           == "u1"
        assert flat["user_profile_name"] == "Alice"

    def test_scalar_array_joined_as_csv(self):
        doc  = {"actions": ["login", "view", "logout"]}
        flat = flatten_mongo_doc(doc)
        assert flat["actions"] == "login, view, logout"

    def test_object_array_indexed(self):
        doc  = {"errors": [{"code": "E1", "msg": "oops"}, {"code": "E2", "msg": "bad"}]}
        flat = flatten_mongo_doc(doc)
        assert flat["errors_0_code"] == "E1"
        assert flat["errors_1_msg"]  == "bad"

    def test_datetime_converted_to_iso(self):
        import datetime
        dt  = datetime.datetime(2024, 1, 15, 8, 0, 0)
        doc = {"created": dt}
        flat = flatten_mongo_doc(doc)
        assert flat["created"] == "2024-01-15T08:00:00"

    def test_empty_document_returns_empty_dict(self):
        assert flatten_mongo_doc({}) == {}

    def test_mixed_nested_document(self):
        """Exercises the full seed data shape from user_logs (DCP-04)."""
        doc = {
            "_id":       "abc123",
            "user":      {"id": "u1", "username": "alice"},
            "actions":   ["login", "logout"],
            "errors":    [{"code": "ExtractionError", "message": "timeout"}],
            "page_views": 12,
        }
        flat = flatten_mongo_doc(doc)
        assert flat["_id"]              == "abc123"
        assert flat["user_id"]          == "u1"
        assert flat["user_username"]    == "alice"
        assert flat["actions"]          == "login, logout"
        assert flat["errors_0_code"]    == "ExtractionError"
        assert flat["page_views"]       == 12


# ── ClickHouseConnector ───────────────────────────────────────────────────────

class TestClickHouseConnector:

    @patch("connectors.drivers.clickhouse.Client")
    def test_connect_raises_connection_error_on_failure(self, mock_client_cls):
        mock_client_cls.side_effect = Exception("Network error")
        from connectors.drivers.clickhouse import ClickHouseConnector
        connector = ClickHouseConnector({"host": "bad", "port": 9000, "user": "u",
                                          "password": "p", "database": "d"})
        with pytest.raises(DCPConnectionError):
            connector.connect()

    @patch("connectors.drivers.clickhouse.Client")
    def test_fetch_batch_returns_normalised_rows(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        # ClickHouse returns (rows, column_types) tuple
        mock_client.execute.return_value = (
            [(1, "SEN-A01", 24.5, 62)],
            [("reading_id", None), ("sensor_id", None),
             ("temperature", None), ("battery_pct", None)],
        )

        from connectors.drivers.clickhouse import ClickHouseConnector
        connector = ClickHouseConnector({"host": "h", "port": 9000, "user": "u",
                                          "password": "p", "database": "d"})
        connector._client = mock_client
        connector._connection = mock_client
        rows = connector.fetch_batch("SELECT * FROM sensor_readings", batch_size=10)

        assert isinstance(rows, list)
        assert rows[0]["sensor_id"]    == "SEN-A01"
        assert rows[0]["temperature"]  == 24.5
        assert rows[0]["battery_pct"]  == 62