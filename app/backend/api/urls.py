"""
api/urls.py
API route definitions — connections wired here.
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
from api.views.files import (
    file_download, 
    file_share, 
    files_list
)

urlpatterns = [
    # ── Connections  ───────────────────────────────────────────────────
    path("connections/",              connections_list,    name="connections-list"),
    path("connections/<uuid:pk>/",    connection_detail,   name="connection-detail"),
    path("connections/test/",         test_connection,     name="connection-test"),
    path("connections/<uuid:pk>/retest/", retest_connection, name="connection-retest"),

    # ── Extraction  ────────────────────────────────────────────────────
    path("extract/",         extract,        name="extract"),
    path("jobs/<uuid:pk>/",  job_detail,     name="job-detail"),

    # ── Submission  ───────────────────────────────────────────────────
    path("submit-batch/",    submit_batch,   name="submit-batch"),

    # ── Files / RBAC  ─────────────────────────────────────────────────
    path("files/",                    files_list,       name="files-list"),
    path("files/<uuid:pk>/download/", file_download,    name="file-download"),
    path("files/<uuid:pk>/share/", file_share, name="file-share"),
]