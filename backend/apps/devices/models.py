"""
apps/devices/models.py

Models:
  - Device : Represents a Raspberry Pi edge device controlling door access.
"""

import uuid
from django.db import models


class Device(models.Model):
    """
    Edge device (Raspberry Pi 4) that physically controls door hardware.

    The backend is the single source of truth.
    Devices are execution-only — they report state, execute commands, but
    contain no business logic.

    status   : Updated by the device via heartbeat (POST /api/servo/activate/).
    last_seen: Timestamp of the last heartbeat received.
    """

    class Status(models.TextChoices):
        ONLINE = "ONLINE", "En línea"
        OFFLINE = "OFFLINE", "Fuera de línea"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.OFFLINE,
    )
    last_seen = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "devices"
        verbose_name = "Dispositivo"
        verbose_name_plural = "Dispositivos"

    def __str__(self):
        return f"{self.name} ({self.status})"
