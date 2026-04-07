"""
connectors/base.py
Abstract BaseConnector — defines the interface all drivers must implement.
Design ref: p.4-5 — Factory Pattern, one class per driver.
"""
from abc import ABC, abstractmethod
from typing import Any
from collections.abc import Generator


class BaseConnector(ABC):
    """
    All drivers extend this class. The ConnectorFactory instantiates
    the correct subclass based on db_type, keeping the API layer
    fully decoupled from database-specific implementations (design p.4).
    """

    def __init__(self, config: dict):
        """
        config: JSONB blob from the Connection model.
        Each driver pulls the keys it needs from this dict.
        """
        self.config = config
        self._connection = None

    # ── Required interface ─────────────────────────────────────────────────────

    @abstractmethod
    def connect(self) -> None:
        """Open and store a connection. Raise ConnectionError on failure."""

    @abstractmethod
    def disconnect(self) -> None:
        """Close the connection cleanly."""

    @abstractmethod
    def test_connection(self) -> bool:
        """
        Lightweight ping — SELECT 1 for SQL, db.command('ping') for Mongo.
        Returns True on success, raises ConnectionError on failure (design p.5).
        """

    @abstractmethod
    def fetch_batch(
        self,
        query: str,
        batch_size: int,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """
        Fetch up to batch_size rows starting at offset.
        Returns a list of JSON-serialisable dicts (design p.6).
        DB-specific types (ObjectId, Decimal, Datetime) must be
        normalised to JSON-safe Python types before returning.
        """

    @abstractmethod
    def fetch_chunks(
        self,
        query: str,
        batch_size: int,
        chunk_size: int,
    ) -> Generator[list[dict[str, Any]], None, None]:
        """
        Yields sub-batches of chunk_size rows using a server-side cursor.
        Used by the Celery task to stream large extractions without
        loading everything into memory at once (design p.6 — Streaming Strategy).
        """

    # ── Context manager support ────────────────────────────────────────────────

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
        return False

    # ── Shared serialisation helper ────────────────────────────────────────────

    @staticmethod
    def _safe_value(value: Any) -> Any:
        """
        Converts non-JSON-serialisable types to safe equivalents.
        Drivers call this on every cell value before returning rows.
        """
        import datetime, decimal, uuid

        if isinstance(value, (datetime.datetime, datetime.date, datetime.time)):
            return value.isoformat()
        if isinstance(value, decimal.Decimal):
            return float(value)
        if isinstance(value, (bytes, bytearray)):
            return value.hex()
        if isinstance(value, uuid.UUID):
            return str(value)
        # Let JSON handle everything else — catches int, float, str, bool, None
        return value