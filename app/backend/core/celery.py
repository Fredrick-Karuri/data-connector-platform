"""
DCP-02 | core/celery.py
Celery application instance — shared across api and worker containers.
"""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

app = Celery("dcp")
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all INSTALLED_APPS/tasks.py modules
app.autodiscover_tasks()