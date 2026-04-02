"""
DCP-08 | connectors/factory.py
ConnectorFactory — instantiates the correct driver based on db_type.
Design ref: p.4-5 — "adding Snowflake requires one new driver class, no other changes."

To add a new database type:
  1. Create connectors/drivers/snowflake.py extending BaseConnector
  2. Add a single entry to DRIVER_MAP below
  That's it. No other file changes needed.
"""
from connectors.base import BaseConnector
from api.exceptions import ConnectionError as DCPConnectionError


# ── Driver registry ────────────────────────────────────────────────────────────
# Import lazily inside get() to avoid loading all DB libraries at startup

DRIVER_MAP: dict[str, str] = {
    "postgres":   "connectors.drivers.postgres.PostgresConnector",
    "mysql":      "connectors.drivers.mysql.MySQLConnector",
    "mongodb":    "connectors.drivers.mongo.MongoConnector",
    "clickhouse": "connectors.drivers.clickhouse.ClickHouseConnector",
}


class ConnectorFactory:

    @staticmethod
    def get(db_type: str, config: dict) -> BaseConnector:
        """
        Returns an instantiated (but not yet connected) driver for the given db_type.
        Raises ConnectionError if db_type is not registered.
        """
        driver_path = DRIVER_MAP.get(db_type)
        if not driver_path:
            raise DCPConnectionError(
                f"Unsupported database type: '{db_type}'. "
                f"Supported types: {list(DRIVER_MAP.keys())}"
            )

        module_path, class_name = driver_path.rsplit(".", 1)
        try:
            import importlib
            module = importlib.import_module(module_path)
            driver_class = getattr(module, class_name)
        except (ImportError, AttributeError) as e:
            raise DCPConnectionError(
                f"Failed to load driver for '{db_type}': {e}"
            ) from e

        return driver_class(config)

    @staticmethod
    def test(db_type: str, config: dict) -> bool:
        """
        Convenience: instantiate driver and run test_connection() in one call.
        Used by POST /api/connections/test/ (DCP-09).
        """
        connector = ConnectorFactory.get(db_type, config)
        return connector.test_connection()

    @staticmethod
    def supported_types() -> list[str]:
        return list(DRIVER_MAP.keys())