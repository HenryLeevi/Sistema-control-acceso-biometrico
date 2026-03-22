"""
apps/access/models.py

Models:
  - Aula            : A physical door / classroom controlled by a device.
  - Schedule        : A time window (day + start/end time) for access rules.
  - AccessPermission: Grants a user access to an Aula within a Schedule.
  - AccessEvent     : Immutable audit log of every access attempt.
"""

import uuid
from django.db import models
from apps.users.models import User
from apps.devices.models import Device


class Aula(models.Model):
    """
    Physical door / classroom.

    desired_state : What the backend wants the door to be (commanded).
    actual_state  : What the device last reported (feedback).
    """

    class DoorState(models.TextChoices):
        OPEN = "OPEN", "Abierta"
        CLOSED = "CLOSED", "Cerrada"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    description = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    desired_state = models.CharField(
        max_length=10,
        choices=DoorState.choices,
        default=DoorState.CLOSED,
    )
    actual_state = models.CharField(
        max_length=10,
        choices=DoorState.choices,
        default=DoorState.CLOSED,
    )

    class Meta:
        db_table = "aulas"
        verbose_name = "Aula"
        verbose_name_plural = "Aulas"

    def __str__(self):
        return f"Aula {self.code} — {self.description}"


class Schedule(models.Model):
    """
    Time window during which access is permitted.
    day_of_week follows Python/ISO convention: 0=Monday … 6=Sunday.
    """

    DAY_CHOICES = [
        (0, "Lunes"),
        (1, "Martes"),
        (2, "Miércoles"),
        (3, "Jueves"),
        (4, "Viernes"),
        (5, "Sábado"),
        (6, "Domingo"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    day_of_week = models.IntegerField(choices=DAY_CHOICES, null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_anytime = models.BooleanField(
        default=False, 
        help_text="Si está marcado, permite el acceso en cualquier momento (ignora día y hora)."
    )

    class Meta:
        db_table = "schedules"
        verbose_name = "Horario"
        verbose_name_plural = "Horarios"

    def __str__(self):
        if self.is_anytime:
            return "Acceso Total"
        return f"{self.get_day_of_week_display()} {self.start_time}–{self.end_time}"


class AccessPermission(models.Model):
    """
    Grants a User access to a specific Aula within a given Schedule window.

    The service layer uses this model to decide whether to allow access
    at validate-time. Multiple permissions can exist for the same user/door
    (e.g., different days/times).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="access_permissions",
    )
    aula = models.ForeignKey(
        Aula,
        on_delete=models.CASCADE,
        related_name="access_permissions",
    )
    schedule = models.ForeignKey(
        Schedule,
        on_delete=models.CASCADE,
        related_name="access_permissions",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "access_permissions"
        verbose_name = "Permiso de Acceso"
        verbose_name_plural = "Permisos de Acceso"

    def __str__(self):
        return f"{self.user} → {self.aula} [{self.schedule}]"


class AccessEvent(models.Model):
    """
    Immutable audit log of every access attempt made against the system.

    IMPORTANT:
    - user is nullable to support attempts where identification failed.
    - correlation_id links events across distributed steps (device → backend).
    - alert_flag is set by the service layer for anomalous events.
    - Never deleted — append-only audit trail.
    """

    class Method(models.TextChoices):
        FACE = "FACE", "Reconocimiento Facial"
        PIN = "PIN", "PIN de Contingencia"
        MANUAL = "MANUAL", "Manual"

    class Result(models.TextChoices):
        SUCCESS = "SUCCESS", "Acceso Concedido"
        DENIED = "DENIED", "Acceso Denegado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="access_events",
        help_text="Null if user could not be identified.",
    )
    aula = models.ForeignKey(
        Aula,
        on_delete=models.PROTECT,
        related_name="access_events",
    )
    device = models.ForeignKey(
        Device,
        on_delete=models.PROTECT,
        related_name="access_events",
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    method = models.CharField(max_length=10, choices=Method.choices)
    result = models.CharField(max_length=10, choices=Result.choices)
    reason = models.TextField(blank=True, null=True, help_text="Denial reason or additional context.")
    alert_flag = models.BooleanField(
        default=False,
        help_text="Flagged by service layer for anomalous or suspicious events.",
    )
    correlation_id = models.UUIDField(
        default=uuid.uuid4,
        help_text="Correlates events across device and backend for distributed tracing.",
        db_index=True,
    )

    class Meta:
        db_table = "access_events"
        verbose_name = "Evento de Acceso"
        verbose_name_plural = "Eventos de Acceso"
        ordering = ["-timestamp"]
        # Prevent accidental mutation — enforced additionally at serializer level.

    def __str__(self):
        return f"[{self.method}] {self.result} — {self.aula} @ {self.timestamp}"
