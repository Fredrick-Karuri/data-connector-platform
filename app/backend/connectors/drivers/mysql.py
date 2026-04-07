"""
connectors/drivers/mysql.py
MySQL driver using mysql-connector-python (design p.4-6).
"""
from collections.abc import Generator
from typing import Any
import mysql.connector
from typing import cast
from connectors.base import BaseConnector
from api.exceptions import ConnectionError as DCPConnectionError, ExtractionError


class MySQLConnector(BaseConnector):

    def connect(self) -> None:
        try:
            self._connection = mysql.connector.connect(
                host=self.config["host"],
                port=int(self.config.get("port", 3306)),
                user=self.config["user"],
                password=self.config["password"],
                database=self.config["database"],
                connection_timeout=10,
            )
        except Exception as e:
            raise DCPConnectionError(f"MySQL connection failed: {e}") from e

    def disconnect(self) -> None:
        if self._connection and self._connection.is_connected():
            self._connection.close()
            self._connection = None

    def test_connection(self) -> bool:
        try:
            self.connect()
            assert self._connection is not None
            cur = self._connection.cursor()
            cur.execute("SELECT 1")
            cur.fetchone()
            cur.close()
            return True
        except DCPConnectionError:
            raise
        except Exception as e:
            raise DCPConnectionError(f"MySQL ping failed: {e}") from e
        finally:
            self.disconnect()

    def fetch_batch(self, query: str, batch_size: int, offset: int = 0) -> list[dict]:
        if not self._connection or not self._connection.is_connected():
            self.connect()
        assert self._connection is not None
        try:
            cur = self._connection.cursor(dictionary=True)
            paginated = f"{query.rstrip(';')} LIMIT %s OFFSET %s"
            cur.execute(paginated, (batch_size, offset))
            rows = cast(list[dict[str, Any]], cur.fetchall())
            cur.close()
            return [self._normalise_row(r) for r in rows]
        except Exception as e:
            raise ExtractionError(f"MySQL fetch failed: {e}") from e

    def fetch_chunks(
        self,
        query: str,
        batch_size: int,
        chunk_size: int,
    ) -> Generator[list[dict], None, None]:
        if not self._connection or not self._connection.is_connected():
            self.connect()
        assert self._connection is not None
        try:
            cur = self._connection.cursor(dictionary=True)
            cur.execute(query)
            fetched = 0
            while fetched < batch_size:
                rows = cast(list[dict[str, Any]], cur.fetchmany(min(chunk_size, batch_size - fetched)))
                if not rows:
                    break
                yield [self._normalise_row(r) for r in rows]
                fetched += len(rows)
            cur.close()
        except Exception as e:
            raise ExtractionError(f"MySQL chunk fetch failed: {e}") from e

    def _normalise_row(self, row: dict[str, Any]) -> dict[str, Any]:
        return {k: self._safe_value(v) for k, v in row.items()}