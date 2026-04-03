"""
DCP-09 | api/urls.py
API route definitions — connections wired here, extract/jobs/files added in DCP-10 through DCP-12.
"""
from django.urls import path
from api.views.connections import (
    connections_list,
    connection_detail,
    test_connection,
    retest_connection,
)
from api.views.extraction import extract, job_detail
from api.views.submission import submit_batch

urlpatterns = [
    # ── Connections (DCP-09) ───────────────────────────────────────────────────
    path("connections/",              connections_list,    name="connections-list"),
    path("connections/<uuid:pk>/",    connection_detail,   name="connection-detail"),
    path("connections/test/",         test_connection,     name="connection-test"),
    path("connections/<uuid:pk>/retest/", retest_connection, name="connection-retest"),

    # ── Extraction (DCP-10) ────────────────────────────────────────────────────
    path("extract/",         extract,        name="extract"),
    path("jobs/<uuid:pk>/",  job_detail,     name="job-detail"),

    # ── Submission (DCP-11) ───────────────────────────────────────────────────
    path("submit-batch/",    submit_batch,   name="submit-batch"),

    # ── Files / RBAC (DCP-12) ─────────────────────────────────────────────────
    # path("files/",                    files_list,       name="files-list"),
    # path("files/<uuid:pk>/download/", file_download,    name="file-download"),
]