"""
apps/roles/models.py

Models:
  - Role     : Named role in the system (ADMIN, SUBADMIN, DOCENTE, BIOMETRICO)
  - UserRole : Associates a User with a Role (many-to-many via explicit join table)
"""

import uuid
from django.db import models
from apps.users.models import User


class Role(models.Model):
    """
    System roles used for RBAC.
    Implemented as an explicit model (not Django groups) for full auditability.
    """

    class RoleName(models.TextChoices):
        ADMIN = "ADMIN", "Administrador"
        SUBADMIN = "SUBADMIN", "Sub-Administrador"
        DOCENTE = "DOCENTE", "Docente"
        BIOMETRICO = "BIOMETRICO", "Biométrico"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=20,
        choices=RoleName.choices,
        unique=True,
    )

    class Meta:
        db_table = "roles"
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.get_name_display()


class UserRole(models.Model):
    """
    Explicit join table between User and Role.
    Allows auditing of role assignments with a dedicated PK.
    A user can have multiple roles.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_roles",
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="user_roles",
    )

    class Meta:
        db_table = "user_roles"
        unique_together = [("user", "role")]
        verbose_name = "Rol de Usuario"
        verbose_name_plural = "Roles de Usuarios"

    def __str__(self):
        return f"{self.user} → {self.role}"
