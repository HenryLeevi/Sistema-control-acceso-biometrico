"""
apps/users/serializers.py

Serializers:
  - UserSerializer          : Full user representation (read + write)
  - CredentialSerializer    : Write-only password_hash (never returned in reads)
  - PinContingencySerializer: PIN management
"""

from rest_framework import serializers
from .models import User, Credential, PinContingency


class UserSerializer(serializers.ModelSerializer):
    """
    Full serializer for the User model.
    `created_at` is read-only (auto-set by DB).
    """

    class Meta:
        model = User
        fields = [
            "id",
            "nombre",
            "apellido",
            "dui",
            "email",
            "fecha_nacimiento",
            "residencia",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_dui(self, value):
        """Validate DUI format: 00000000-0 (8 digits, dash, 1 digit)."""
        import re
        if not re.match(r"^\d{8}-\d$", value):
            raise serializers.ValidationError(
                "El DUI debe tener el formato: 00000000-0"
            )
        return value

    def validate_email(self, value):
        return value.lower().strip()


class CredentialSerializer(serializers.ModelSerializer):
    """
    password_hash is write-only — never exposed in API responses.
    Hashing must be performed at the service/view layer before saving.
    """

    password_hash = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Credential
        fields = ["id", "user", "password_hash", "updated_at"]
        read_only_fields = ["id", "updated_at"]


class PinContingencySerializer(serializers.ModelSerializer):
    """
    PIN is write-only. Expiry date must be in the future.
    Hashing must be performed at the service/view layer before saving.
    """

    pin_hash = serializers.CharField(write_only=True, min_length=4, max_length=8)

    class Meta:
        model = PinContingency
        fields = ["id", "user", "pin_hash", "is_active", "created_at", "expires_at"]
        read_only_fields = ["id", "created_at"]

    def validate_expires_at(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError(
                "La fecha de expiración debe ser en el futuro."
            )
        return value
