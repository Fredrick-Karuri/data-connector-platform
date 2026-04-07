"""
connectors/drivers/mongo.py
MongoDB driver using pymongo with document flattening (design p.4-6, p.9).
flatten_mongo_doc() converts nested docs/arrays to dot-notation for the grid.
"""
from typing import Any, Generator
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
import json

from connectors.base import BaseConnector
from api.exceptions import ConnectionError as DCPConnectionError, ExtractionError


class MongoConnector(BaseConnector):

    def connect(self) -> None:
        try:
            self._client = MongoClient(
                self.config["uri"],
                serverSelectionTimeoutMS=10_000,
            )
            # Force connection check
            self._client.admin.command("ping")
            db_name = self.config.get("database", "test")
            self._db = self._client[db_name]
            self._connection = self._db
        except (ConnectionFailure, Exception) as e:
            raise DCPConnectionError(f"MongoDB connection failed: {e}") from e

    def disconnect(self) -> None:
        if hasattr(self, "_client") and self._client:
            self._client.close()
            self._client = None
            self._connection = None

    def test_connection(self) -> bool:
        try:
            self.connect()
            return True
        except DCPConnectionError:
            raise
        finally:
            self.disconnect()

    def fetch_batch(self, query: str, batch_size: int, offset: int = 0) -> list[dict]:
        """
        query: JSON string representing a Mongo filter, e.g. '{"user.id": "usr_001"}'
        Falls back to {} (all documents) if query is empty or invalid.
        """
        if self._connection is None:
            self.connect()
        
        try:
            collection_name, mongo_filter = self._parse_query(query)
            collection = self._db[collection_name]
            cursor = collection.find(mongo_filter).skip(offset).limit(batch_size)
            return [flatten_mongo_doc(doc) for doc in cursor]
        except ExtractionError:
            raise
        except Exception as e:
            raise ExtractionError(f"MongoDB fetch failed: {e}") from e

    def fetch_chunks(
        self,
        query: str,
        batch_size: int,
        chunk_size: int,
    ) -> Generator[list[dict], None, None]:
        if self._connection is None:
            self.connect()
        try:
            collection_name, mongo_filter = self._parse_query(query)
            collection = self._db[collection_name]
            cursor = collection.find(mongo_filter).limit(batch_size)
            chunk = []
            for doc in cursor:
                chunk.append(flatten_mongo_doc(doc))
                if len(chunk) >= chunk_size:
                    yield chunk
                    chunk = []
            if chunk:
                yield chunk
        except ExtractionError:
            raise
        except Exception as e:
            raise ExtractionError(f"MongoDB chunk fetch failed: {e}") from e

    def _parse_query(self, query: str) -> tuple[str, dict]:
        """
        Expects query format: 'collection_name|{"field": "value"}'
        e.g. 'user_logs|{"user.id": "usr_001"}'
        Falls back to empty filter if malformed.
        """
        try:
            if "|" in query:
                collection_name, filter_str = query.split("|", 1)
                return collection_name.strip(), json.loads(filter_str.strip())
            return query.strip(), {}
        except (json.JSONDecodeError, ValueError):
            raise ExtractionError(
                "Invalid MongoDB query format. Expected: 'collection|{filter_json}'"
            )


def flatten_mongo_doc(doc: dict, prefix: str = "") -> dict[str, Any]:
    """
    Flattens nested MongoDB documents into a dot-notation key-value structure
    suitable for the tabular grid (design p.9).

    Examples:
      {"user": {"id": "1"}}            → {"user_id": "1"}
      {"actions": ["login", "logout"]} → {"actions": "login, logout"}
      {"_id": ObjectId(...)}           → {"_id": "507f1f77..."}
    """
    from bson import ObjectId
    import datetime

    items = {}
    for key, value in doc.items():
        new_key = f"{prefix}{key}" if prefix else key

        if key == "_id":
            # BSON ObjectId → string (design p.9)
            items[new_key] = str(value)

        elif isinstance(value, ObjectId):
            items[new_key] = str(value)

        elif isinstance(value, datetime.datetime):
            items[new_key] = value.isoformat()

        elif isinstance(value, dict):
            # Recurse into nested objects with underscore-separated prefix
            items.update(flatten_mongo_doc(value, f"{new_key}_"))

        elif isinstance(value, list):
            # Arrays: try to flatten dicts, otherwise join as comma-separated string
            if value and isinstance(value[0], dict):
                # List of objects → indexed keys e.g. errors_0_code, errors_1_code
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        items.update(flatten_mongo_doc(item, f"{new_key}_{i}_"))
                    else:
                        items[f"{new_key}_{i}"] = str(item)
            else:
                # Scalar array → comma-separated string (design p.9)
                items[new_key] = ", ".join(str(i) for i in value)

        else:
            items[new_key] = value

    return items