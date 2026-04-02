"""
DCP-08 | connectors/drivers/postgres.py
PostgreSQL driver using psycopg2 with server-side cursor (design p.4-6).
"""
from typing import Any, Generator
import psycopg2
import psycopg2.extras

from connectors.base import BaseConnector
from api.exceptions import ConnectionError as DCPConnectionError, ExtractionError


class PostgresConnector(BaseConnector):

    def connect(self) -> None:
        try:
            self._connection = psycopg2.connect(
                host=self.config["host"],
                port=int(self.config.get("port", 5432)),
                user=self.config["user"],
                password=self.config["password"],
                dbname=self.config["database"],
                connect_timeout=10,
            )
        except Exception as e:
            raise DCPConnectionError(f"PostgreSQL connection failed: {e}") from e

    def disconnect(self) -> None:
        if self._connection:
            self._connection.close()
            self._connection = None

    def test_connection(self) -> bool:
        try:
            self.connect()
            assert self._connection is not None
            with self._connection.cursor() as cur:
                cur.execute("SELECT 1")
            return True
        except DCPConnectionError:
            raise
        except Exception as e:
            raise DCPConnectionError(f"PostgreSQL ping failed: {e}") from e
        finally:
            self.disconnect()

    def fetch_batch(self, query: str, batch_size: int, offset: int = 0) -> list[dict]:
        if not self._connection:
            self.connect()
        assert self._connection is not None
        try:
            with self._connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                paginated = f"{query.rstrip(';')} LIMIT %s OFFSET %s"
                cur.execute(paginated, (batch_size, offset))
                rows = cur.fetchall()
                return [self._normalise_row(dict(r)) for r in rows]
        except Exception as e:
            raise ExtractionError(f"PostgreSQL fetch failed: {e}") from e

    def fetch_chunks(
        self,
        query: str,
        batch_size: int,
        chunk_size: int,
    ) -> Generator[list[dict], None, None]:
        """Uses a named server-side cursor to stream rows without loading all into memory."""
        if not self._connection:
            self.connect()
        assert self._connection is not None
        try:
            with self._connection.cursor(
                "dcp_cursor",
                cursor_factory=psycopg2.extras.RealDictCursor,
            ) as cur:
                cur.execute(query)
                fetched = 0
                while fetched < batch_size:
                    size = min(chunk_size, batch_size - fetched)
                    rows = cur.fetchmany(size)
                    if not rows:
                        break
                    yield [self._normalise_row(dict(r)) for r in rows]
                    fetched += len(rows)
        except Exception as e:
            raise ExtractionError(f"PostgreSQL chunk fetch failed: {e}") from e

    def _normalise_row(self, row: dict[str, Any]) -> dict[str, Any]:
        return {k: self._safe_value(v) for k, v in row.items()}