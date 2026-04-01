"""
Custom exception hierarchy stub — fully implemented in DCP-19.
Categories: ConnectionError, ExtractionError, TransformationError, PersistenceError (design p.21)
"""
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    # Falls back to DRF default until DCP-19 wires the full hierarchy
    return exception_handler(exc, context)