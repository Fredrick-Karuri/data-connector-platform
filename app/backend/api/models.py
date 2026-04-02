"""
DCP-05 | api/models.py
Core models: User, Connection, ExtractionJob, ProcessedRecord, FileMetadata, FileAccessControl
Design ref: p.13-14 (schema), p.4 (Connection), p.6 (ExtractionJob), p.10-11 (File), p.12 (RBAC)
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


# ── User ──────────────────────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, role="user"):
        if not username:
            raise ValueError("Username is required.")
        user = self.model(username=username, role=role)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None):
        user = self.create_user(username, password, role="admin")
        user.is_staff = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user with Admin/User RBAC role (design p.12).
    role is embedded in JWT payload via RoleTokenObtainPairSerializer (DCP-02).
    """
    ROLE_ADMIN = "admin"
    ROLE_USER = "user"
    ROLE_CHOICES = [(ROLE_ADMIN, "Admin"), (ROLE_USER, "User")]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username   = models.CharField(max_length=150, unique=True)
    email      = models.EmailField(blank=True)
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_USER)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects:UserManager = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.username} ({self.role})"


# ── Connection ────────────────────────────────────────────────────────────────

class Connection(models.Model):
    """
    Stores source DB credentials and health status (design p.4-5).
    JSONB config allows different credential shapes per DB type (design p.5 — Why JSONB).
    """
    DB_POSTGRES    = "postgres"
    DB_MYSQL       = "mysql"
    DB_MONGODB     = "mongodb"
    DB_CLICKHOUSE  = "clickhouse"
    DB_TYPE_CHOICES = [
        (DB_POSTGRES,   "PostgreSQL"),
        (DB_MYSQL,      "MySQL"),
        (DB_MONGODB,    "MongoDB"),
        (DB_CLICKHOUSE, "ClickHouse"),
    ]

    STATUS_HEALTHY  = "Healthy"
    STATUS_OFFLINE  = "Offline"
    STATUS_UNTESTED = "Untested"
    STATUS_CHOICES  = [
        (STATUS_HEALTHY,  "Healthy"),
        (STATUS_OFFLINE,  "Offline"),
        (STATUS_UNTESTED, "Untested"),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name        = models.CharField(max_length=255)
    db_type     = models.CharField(max_length=20, choices=DB_TYPE_CHOICES)
    config      = models.JSONField()
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_UNTESTED)
    last_tested = models.DateTimeField(null=True, blank=True)
    owner       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="connections")
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "connections"
        indexes = [
            models.Index(fields=["db_type"], name="idx_connection_db_type"),
        ]

    def __str__(self):
        return f"{self.name} ({self.db_type}) — {self.status}"


# ── ExtractionJob ─────────────────────────────────────────────────────────────

class ExtractionJob(models.Model):
    """
    Tracks the lifecycle of every Celery batch extraction (design p.6-7).
    status transitions: PENDING → PROGRESS → SUCCESS | FAILED
    """
    STATUS_PENDING  = "PENDING"
    STATUS_PROGRESS = "PROGRESS"
    STATUS_SUCCESS  = "SUCCESS"
    STATUS_FAILED   = "FAILED"
    STATUS_CHOICES  = [
        (STATUS_PENDING,  "Pending"),
        (STATUS_PROGRESS, "Progress"),
        (STATUS_SUCCESS,  "Success"),
        (STATUS_FAILED,   "Failed"),
    ]

    job_id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    connection     = models.ForeignKey(Connection, on_delete=models.CASCADE, related_name="jobs")
    owner          = models.ForeignKey(User, on_delete=models.CASCADE, related_name="jobs")
    batch_size     = models.IntegerField(default=1000)
    query_metadata = models.JSONField()
    status         = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    result_preview = models.JSONField(null=True, blank=True)
    error_message  = models.TextField(blank=True)
    started_at     = models.DateTimeField(null=True, blank=True)
    completed_at   = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "extraction_jobs"
        indexes = [
            models.Index(fields=["job_id", "status"], name="idx_job_id_status"),
            models.Index(fields=["owner", "status"],  name="idx_owner_status"),
        ]

    def __str__(self):
        return f"Job {self.job_id} [{self.status}]"


# ── ProcessedRecord ───────────────────────────────────────────────────────────

class ProcessedRecord(models.Model):
    """
    Stores actual data rows pulled from source DBs (design p.14).
    JSONB data allows any schema from any source (design p.14 — Why JSONB for Records).
    Written during the dual-storage submission flow (DCP-11).
    """
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job        = models.ForeignKey(ExtractionJob, on_delete=models.CASCADE, related_name="records")
    data       = models.JSONField()
    row_index  = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "processed_records"
        indexes  = [
            models.Index(fields=["job"], name="idx_record_job"),
        ]
        ordering = ["row_index"]


# ── FileMetadata ──────────────────────────────────────────────────────────────

class FileMetadata(models.Model):
    """
    Links physical files on disk to the system's RBAC logic (design p.10-11).
    UUID filename prevents IDOR attacks (design p.11 — Why UUID filenames).
    """
    FORMAT_CSV  = "csv"
    FORMAT_JSON = "json"
    FORMAT_CHOICES = [(FORMAT_CSV, "CSV"), (FORMAT_JSON, "JSON")]

    file_id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_path       = models.CharField(max_length=512)
    format          = models.CharField(max_length=4, choices=FORMAT_CHOICES)
    owner           = models.ForeignKey(User, on_delete=models.CASCADE, related_name="files")
    job             = models.ForeignKey(ExtractionJob, on_delete=models.SET_NULL, null=True, related_name="files")
    source_metadata = models.JSONField()
    checksum        = models.CharField(max_length=64)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "file_metadata"
        indexes  = [
            models.Index(fields=["owner"], name="idx_file_owner"),
        ]

    def __str__(self):
        return f"{self.file_id}.{self.format} (owner: {self.owner})"


# ── FileAccessControl ─────────────────────────────────────────────────────────

class FileAccessControl(models.Model):
    """
    Manages "Shared with Me" file access beyond the owner (design p.12).
    The RBAC gatekeeper in DCP-12 checks this table for shared_with[] access.
    """
    ACCESS_VIEWER     = "VIEWER"
    ACCESS_DOWNLOADER = "DOWNLOADER"
    ACCESS_CHOICES    = [
        (ACCESS_VIEWER,     "Viewer"),
        (ACCESS_DOWNLOADER, "Downloader"),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_metadata = models.ForeignKey(FileMetadata, on_delete=models.CASCADE, related_name="access_grants")
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name="shared_files")
    access_level  = models.CharField(max_length=12, choices=ACCESS_CHOICES)
    granted_by    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="grants_given")
    granted_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "file_access_control"
        unique_together = [("file_metadata", "user")]
        indexes = [
            models.Index(fields=["user"], name="idx_fac_user"),
        ]

    def __str__(self):
        return f"{self.user} → {self.file_metadata.file_id} ({self.access_level})"