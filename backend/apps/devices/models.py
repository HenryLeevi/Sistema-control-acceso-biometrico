"""
apps/devices/models.py

Models:
  - Device : Represents a Raspberry Pi edge device.
  - Lock   : Represents a physical lock (servo) controlled by a device.
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
    name = models.CharField(max_length=100, unique=True, help_text="Nombre amigable del dispositivo (ej. RPi-Laboratorio-1)")
    model = models.CharField(max_length=50, default="Raspberry Pi 4 Model B")
    serial_number = models.CharField(max_length=100, unique=True, null=True, blank=True, help_text="Número de serie único del hardware")
    description = models.TextField(blank=True, null=True, help_text="Ubicación física o notas adicionales")
    
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
        return f"{self.name} ({self.serial_number}) - {self.status}"


class Lock(models.Model):
    """
    Physical lock (Servo) controlled by an Edge Device and located in an Aula.
    """
    class LockType(models.TextChoices):
        SERVO = "SERVO", "Servomotor"
        MAGNETIC = "MAGNETIC", "Cerradura Electromagnética"
        SOLENOID = "SOLENOID", "Solenoide"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="Nombre de la cerradura (ej. Puerta Principal)")
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="locks")
    aula = models.OneToOneField("access.Aula", on_delete=models.CASCADE, related_name="lock")
    
    gpio_pin = models.IntegerField(help_text="PIN GPIO donde está conectado el servomotor (ej. 18)")
    lock_type = models.CharField(
        max_length=20,
        choices=LockType.choices,
        default=LockType.SERVO
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "device_locks"
        verbose_name = "Cerradura"
        verbose_name_plural = "Cerraduras"

    def __str__(self):
        return f"{self.name} (Aula: {self.aula.code}) - Pin: {self.gpio_pin}"
