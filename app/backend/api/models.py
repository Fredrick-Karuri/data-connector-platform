"""
api/models.py
Model stubs — fully defined in DCP-05 (Users, Connections, ExtractionJobs, ProcessedRecords)
and DCP-06 (FileMetadata, FileAccessControl).
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, role="user"):
        user = self.model(username=username, role=role)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None):
        return self.create_user(username, password, role="admin")


class User(AbstractBaseUser):
    """
    Custom user model with Admin/User RBAC role (design p.12).
    Expanded with full field set in DCP-05.
    """
    ROLE_CHOICES = [("admin", "Admin"), ("user", "User")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="user")
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = "username"
    objects = UserManager()

    @property
    def is_admin(self):
        return self.role == "admin"

    class Meta:
        db_table = "users"