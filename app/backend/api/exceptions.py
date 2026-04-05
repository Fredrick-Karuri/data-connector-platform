"""
DCP-19 | api/exceptions.py
Full custom exception hierarchy + DRF handler (design p.21).
Categories: ConnectionError→400, ExtractionError→422,
            TransformationError→log+flag, PersistenceError→500+rollback
"""
import logging

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


# ── Exception classes ─────────────────────────────────────────────────────────

class ConnectionError(APIException):
    """Invalid credentials or DB offline → 400 (design p.21)."""
    status_code  = status.HTTP_400_BAD_REQUEST
    default_code = "ConnectionError"
    default_detail = "Source unreachable."


class ExtractionError(APIException):
    """SQL syntax error or Mongo timeout → 422 (design p.21)."""
    status_code  = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_code = "ExtractionError"
    default_detail = "Query failed."


class TransformationError(Exception):
    """
    Normalisation failure on a single row (design p.21).
    Not an APIException — caught at driver level, row flagged as
    'Unreadable', never bubbles to a 5xx.
    """
    def __init__(self, row_index: int, field: str, reason: str):
        self.row_index = row_index
        self.field     = field
        self.reason    = reason
        super().__init__(f"Row {row_index}, field '{field}': {reason}")


class PersistenceError(APIException):
    """Disk full or DB constraint violation → 500 + rollback (design p.21)."""
    status_code  = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_code = "PersistenceError"
    default_detail = "Persistence failure."


# ── DRF exception handler ─────────────────────────────────────────────────────

def custom_exception_handler(exc, context):
    """
    Maps domain exceptions to structured JSON with a `code` field
    so the frontend can handle them by category (design p.21).
    """
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "code":   getattr(exc, "default_code", "Error"),
            "detail": response.data.get("detail", str(exc)),
        }
        return response

    if isinstance(exc, ConnectionError):
        logger.warning("ConnectionError: %s", exc)
        return Response(
            {"code": "ConnectionError", "detail": str(exc.detail)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, ExtractionError):
        logger.warning("ExtractionError: %s", exc)
        return Response(
            {"code": "ExtractionError", "detail": str(exc.detail)},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if isinstance(exc, PersistenceError):
        logger.error("PersistenceError (rollback triggered): %s", exc)
        return Response(
            {"code": "PersistenceError", "detail": str(exc.detail)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    logger.exception("Unhandled exception in view: %s", exc)
    return Response(
        {"code": "InternalError", "detail": "An unexpected error occurred."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )