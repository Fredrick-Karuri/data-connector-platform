"""
DCP-08 | api/exceptions.py
Custom exception hierarchy (design p.21).
Full DRF handler wired in DCP-19; classes defined here so drivers can import them now.
"""
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


# ── Exception classes ─────────────────────────────────────────────────────────

class ConnectionError(APIException):
    """Invalid credentials or DB offline → 400 (design p.21)."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "ConnectionError"
    default_detail = "Source unreachable."


class ExtractionError(APIException):
    """SQL syntax error or Mongo timeout → 422 (design p.21)."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_code = "ExtractionError"
    default_detail = "Query failed."


class TransformationError(Exception):
    """Normalisation failure on a specific row — logged, row flagged (design p.21)."""
    pass


class PersistenceError(APIException):
    """Disk full or DB constraint violation → 500 + rollback (design p.21)."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_code = "PersistenceError"
    default_detail = "Persistence failure."


# ── DRF exception handler (expanded in DCP-19) ────────────────────────────────

def custom_exception_handler(exc, context):
    return exception_handler(exc, context)