"""
connectors/drivers/clickhouse.py
ClickHouse driver using clickhouse-driver for OLAP-speed batching (design p.4-6).
"""
from collections.abc import Generator
from typing import Any
from clickhouse_driver import Client
from clickhouse_driver.errors import NetworkError, ServerException

from connectors.base import BaseConnector
from api.exceptions import ConnectionError as DCPConnectionError, ExtractionError
from typing import cast
import re

from core.logging import get_logger
logger = get_logger(__name__)

class ClickHouseConnector(BaseConnector):

    def connect(self) -> None:
        try:
            self._client = Client(
                host=self.config["host"],
                port=int(self.config.get("port", 9000)),
                user=self.config["user"],
                password=self.config["password"],
                database=self.config.get("database", "default"),
                connect_timeout=10,
                settings={"max_execution_time": 55},  # Align with Celery soft limit
            )
            self._connection = self._client
        except Exception as e:
            raise DCPConnectionError(f"ClickHouse connection failed: {e}") from e

    def disconnect(self) -> None:
        if self._client:
            self._client.disconnect()
            self._client = None
            self._connection = None

    def test_connection(self) -> bool:
        try:
            self.connect()
            assert self._client is not None
            self._client.execute("SELECT 1")
            return True
        except DCPConnectionError:
            raise
        except Exception as e:
            raise DCPConnectionError(f"ClickHouse ping failed: {e}") from e
        finally:
            self.disconnect()

    def fetch_batch(self, query: str, batch_size: int, offset: int = 0) -> list[dict]:
        if not self._connection:
            self.connect()
        assert self._client is not None
        try:
            paginated = f"{self._strip_limit(query)} LIMIT {batch_size} OFFSET {offset}"
            result = cast(
                tuple[list[tuple[Any, ...]], list[tuple[str, Any]]],
                self._client.execute(paginated, with_column_types=True)
            )
            rows, columns = result
            col_names = [col[0] for col in columns]
            return [
                self._normalise_row(dict(zip(col_names, row)))
                for row in rows
            ]
        except (NetworkError, ServerException) as e:
            raise ExtractionError(f"ClickHouse fetch failed: {e}") from e


    def fetch_chunks(self, query: str, batch_size: int, chunk_size: int) -> Generator[list[dict], None, None]:
        if not self._connection:
            self.connect()
        assert self._client is not None
        try:
            clean = self._strip_limit(query)
            logger.debug("ClickHouse clean query: %r", clean)
            meta = cast(
                tuple[list[Any], list[tuple[str, Any]]],
                self._client.execute(f"{clean} LIMIT 0", with_column_types=True)
            )
            col_names = [col[0] for col in meta[1]]

            settings = {"max_block_size": chunk_size}
            chunk: list[dict] = []
            fetched = 0

            for row in self._client.execute_iter(clean, settings=settings):
                if fetched >= batch_size:
                    break
                chunk.append(self._normalise_row(dict(zip(col_names, row))))
                fetched += 1
                if len(chunk) >= chunk_size:
                    yield chunk
                    chunk = []

            if chunk:
                yield chunk

        except (NetworkError, ServerException) as e:
            raise ExtractionError(f"ClickHouse chunk fetch failed: {e}") from e

    def _normalise_row(self, row: dict[str, Any]) -> dict[str, Any]:
        normalised = {}
        for k, v in row.items():
            # ClickHouse-specific: Int64/UInt64 are Python int — safe as-is
            # IPv4/IPv6 addresses come as strings — safe
            normalised[k] = self._safe_value(v)
        return normalised


    def _strip_limit(self, query: str) -> str:
        return re.sub(
            r'[\s;]*LIMIT\s+\d+(\s+OFFSET\s+\d+)?[\s;]*$',
            '',
            query.strip(),
            flags=re.IGNORECASE | re.MULTILINE,
        ).strip()