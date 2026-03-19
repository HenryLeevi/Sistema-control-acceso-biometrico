"""
apps/biometric/models.py

Models:
  - Biometric : Azure AI Face enrollment record for a user.
                A user can have multiple biometric records (e.g., re-enrollment,
                multiple angles). Only one should be active at a time.
"""

import uuid
from django.db import models
from apps.users.models import User


class Biometric(models.Model):
    """
    Stores a reference to a biometric enrollment in Azure AI Face.

    face_id    : The Person ID returned by Azure AI Face after enrollment.
    storage_url: The URL of the enrolled image stored in Azure Blob Storage.

    A user can have multiple records (non-unique FK).
    Service layer enforces that only one is active per user.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="biometrics",
        help_text="The user this biometric record belongs to.",
    )
    face_id = models.CharField(
        max_length=255,
        help_text="Azure AI Face Person ID (returned after enrollment).",
    )
    storage_url = models.URLField(
        max_length=500,
        help_text="Azure Blob Storage URL of the enrolled face image.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this record is the active enrollment for recognition.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "biometrics"
        verbose_name = "Biométrico"
        verbose_name_plural = "Biométricos"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Biométrico de {self.user} (activo={self.is_active})"
