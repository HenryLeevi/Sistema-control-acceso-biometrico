"""
apps/users/models.py

Models:
  - User        : Core user entity (UUID PK)
  - Credential  : Hashed password for a user
  - PinContingency : Temporary PIN fallback for a user
"""

import uuid
from django.db import models


class User(models.Model):
    """
    Core user of the biometric access control system.
    Does NOT extend Django's AbstractUser — auth is handled separately
    via the Credential model and JWT.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dui = models.CharField(max_length=10, unique=True, help_text="DUI format: 00000000-0")
    email = models.EmailField(unique=True)
    fecha_nacimiento = models.DateField()
    residencia = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "users"
        ordering = ["apellido", "nombre"]
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.dui})"

    @property
    def full_name(self):
        return f"{self.nombre} {self.apellido}"


class Credential(models.Model):
    """
    Stores the hashed password for a user.
    Separated from User to isolate credential management.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="credential",
    )
    password_hash = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "credentials"
        verbose_name = "Credencial"
        verbose_name_plural = "Credenciales"

    def __str__(self):
        return f"Credencial de {self.user}"


class PinContingency(models.Model):
    """
    Temporary PIN used as a fallback authentication method.
    Each user can have multiple PINs (e.g., rotated PINs).
    Only one should be active at a time (enforced at service layer).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="pin_contingencies",
    )
    pin_hash = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "pin_contingencies"
        verbose_name = "PIN de Contingencia"
        verbose_name_plural = "PINs de Contingencia"

    def __str__(self):
        return f"PIN de {self.user} (activo={self.is_active})"
