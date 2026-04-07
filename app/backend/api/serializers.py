"""
api/serializers.py
Serializers for all models + JWT role injection.
Design ref: p.4 (Connection), p.6 (ExtractionJob), p.10-11 (FileMetadata), p.12 (RBAC)
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings

from .models import (
    User, Connection, ExtractionJob,
    ProcessedRecord, FileMetadata, FileAccessControl,
)
from .models import User as AppUser
from typing import Any


# ── Auth ──────────────────────────────────────────────────────────────────────

class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Embeds role in JWT payload so frontend RBAC checks work without an API call."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        return token

    def validate(self, attrs):
        data: Any = super().validate(attrs)
        user: AppUser = self.user  # type: ignore[assignment]
        data["user"] = {
            "id":       str(user.id),
            "username": user.username,
            "role":     user.role,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["id", "username", "email", "role", "created_at"]
        read_only_fields = ["id", "created_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ["username", "email", "password", "role"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            role=validated_data.get("role", User.ROLE_USER),
        )


# ── Connection ────────────────────────────────────────────────────────────────

class ConnectionSerializer(serializers.ModelSerializer):
    """
    Validates connection config before the ConnectorFactory tests it (DCP-09).
    config is JSONB — different shapes per db_type (design p.5).
    """
    owner = UserSerializer(read_only=True)

    class Meta:
        model  = Connection
        fields = [
            "id", "name", "db_type", "config",
            "status", "last_tested", "owner", "created_at",
        ]
        read_only_fields = ["id", "status", "last_tested", "owner", "created_at"]

    def validate_config(self, value):
        """Ensure minimum required keys are present per db_type."""
        db_type = self.initial_data.get("db_type", "")
        required = {
            "postgres":   ["host", "port", "user", "password", "database"],
            "mysql":      ["host", "port", "user", "password", "database"],
            "mongodb":    ["uri"],
            "clickhouse": ["host", "port", "user", "password", "database"],
        }
        missing = [k for k in required.get(db_type, []) if k not in value]
        if missing:
            raise serializers.ValidationError(
                f"Missing required config keys for {db_type}: {missing}"
            )
        return value


class ConnectionTestSerializer(serializers.Serializer):
    """Payload for POST /api/connections/test/ — validate only, no save."""
    name    = serializers.CharField()
    db_type = serializers.ChoiceField(choices=Connection.DB_TYPE_CHOICES)
    config  = serializers.JSONField()


# ── ExtractionJob ─────────────────────────────────────────────────────────────

class ExtractRequestSerializer(serializers.Serializer):
    """Validates POST /api/extract/ payload (design p.20)."""
    connection_id = serializers.UUIDField()
    query         = serializers.CharField()
    batch_size    = serializers.IntegerField(min_value=1, max_value=10_000)

    def validate_connection_id(self, value):
        if not Connection.objects.filter(id=value).exists():
            raise serializers.ValidationError("Connection not found.")
        return value


class ExtractionJobSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model  = ExtractionJob
        fields = [
            "job_id", "connection", "owner", "batch_size",
            "query_metadata", "status", "result_preview",
            "error_message", "started_at", "completed_at", "created_at",
        ]
        read_only_fields = ["__all__"]


# ── Submit Batch ──────────────────────────────────────────────────────────────

class SubmitBatchSerializer(serializers.Serializer):
    """
    Validates POST /api/submit-batch/ — the dual-storage trigger (design p.10-11, p.20).
    Diff map validation: ensures modified_data only references known row keys.
    """
    job_id        = serializers.UUIDField()
    original_data = serializers.ListField(child=serializers.DictField())
    modified_data = serializers.ListField(child=serializers.DictField())
    format        = serializers.ChoiceField(choices=["csv", "json"])

    def validate_job_id(self, value):
        try:
            ExtractionJob.objects.get(job_id=value, status=ExtractionJob.STATUS_SUCCESS)
        except ExtractionJob.DoesNotExist:
            raise serializers.ValidationError(
                "Job not found or not yet completed successfully."
            )
        return value

    def validate(self, data):
        """
        Cross-field: verify modified_data rows don't introduce new columns
        that weren't in original_data (prevents schema drift on submission).
        """
        if not data.get("original_data"):
            raise serializers.ValidationError("original_data cannot be empty.")

        original_keys = set()
        for row in data["original_data"]:
            original_keys.update(row.keys())
            
        for i, row in enumerate(data.get("modified_data", [])):
            extra = set(row.keys()) - original_keys
            if extra:
                raise serializers.ValidationError(
                    {f"modified_data[{i}]": f"Unknown fields introduced: {extra}"}
                )
        return data


# ── ProcessedRecord ───────────────────────────────────────────────────────────

class ProcessedRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProcessedRecord
        fields = ["id", "job", "data", "row_index", "created_at"]
        read_only_fields = ["__all__"]


# ── FileMetadata ──────────────────────────────────────────────────────────────

class FileMetadataSerializer(serializers.ModelSerializer):
    """
    Read-only — FileMetadata is created exclusively by SubmissionService (DCP-11).
    owner resolved from JWT; file_path never exposed to client (security).
    """
    owner = UserSerializer(read_only=True)

    class Meta:
        model  = FileMetadata
        fields = [
            "file_id", "format", "owner",
            "source_metadata", "checksum", "created_at",
            # file_path intentionally excluded — never sent to client
        ]
        read_only_fields = ["__all__"]


# ── FileAccessControl ─────────────────────────────────────────────────────────

class FileAccessControlSerializer(serializers.ModelSerializer):
    """Used by admin to grant shared access to a file (design p.12)."""
    class Meta:
        model  = FileAccessControl
        fields = ["id", "file_metadata", "user", "access_level", "granted_at"]
        read_only_fields = ["id", "granted_at"]

    def validate(self, data):
        # Prevent owner from granting access to themselves
        file_meta = data["file_metadata"]
        if data["user"] == file_meta.owner:
            raise serializers.ValidationError(
                "Cannot grant access to the file owner — they already have full access."
            )
        return data