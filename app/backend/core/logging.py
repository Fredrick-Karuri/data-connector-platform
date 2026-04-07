"""
core/logging.py
Centralised logging configuration for DCP.
Usage in any module:  from core.logging import get_logger; logger = get_logger(__name__)
"""
import logging
import os

# ── Format ────────────────────────────────────────────────────────────────────
_LOG_LEVEL = os.environ.get("LOG_LEVEL", "DEBUG" if os.environ.get("DJANGO_DEBUG", "True") == "True" else "INFO")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "verbose": {
            "format": "{asctime} {levelname} {name} {process:d} {message}",
            "style": "{",
            "datefmt": "%Y-%m-%dT%H:%M:%S",
        },
        "simple": {
            "format": "{levelname} {name} {message}",
            "style": "{",
        },
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },

    "loggers": {
        # ── DCP application namespaces ─────────────────────────────────────
        "api": {
            "handlers": ["console"],
            "level": _LOG_LEVEL,
            "propagate": False,
        },
        "tasks": {
            "handlers": ["console"],
            "level": _LOG_LEVEL,
            "propagate": False,
        },
        "services": {
            "handlers": ["console"],
            "level": _LOG_LEVEL,
            "propagate": False,
        },
        "connectors": {
            "handlers": ["console"],
            "level": _LOG_LEVEL,
            "propagate": False,
        },
        # ── Django internals ───────────────────────────────────────────────
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING",   # suppress 4xx noise; 5xx still surfaces
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },

    # Catch-all: WARNING+ for anything not explicitly named above
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}


def get_logger(name: str) -> logging.Logger:
    """
    Drop-in replacement for logging.getLogger().
    Ensures the logger hierarchy defined in LOGGING is always used.

        from core.logging import get_logger
        logger = get_logger(__name__)
    """
    return logging.getLogger(name)