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

    On CREATE, also accepts:
      - username (required) — used to create a matching Django auth.User
      - password (required) — set on the Django auth.User for login

    On UPDATE (PATCH), username/password are optional.
    """

    # Write-only fields for Django auth.User sync
    username = serializers.CharField(
        max_length=150, required=False, write_only=True,
        help_text="Username for login (creates Django auth.User)."
    )
    password = serializers.CharField(
        max_length=128, required=False, write_only=True,
        help_text="Password for login."
    )

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
            # write-only auth fields
            "username",
            "password",
        ]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "dui": {"required": False, "allow_blank": True},
            "fecha_nacimiento": {"required": False, "allow_null": True},
            "residencia": {"required": False, "allow_blank": True},
        }

    def validate_dui(self, value):
        """Validate DUI format: 00000000-0 (8 digits, dash, 1 digit).
        Empty/blank values are stored as NULL to avoid unique constraint issues."""
        if not value or not value.strip():
            return None
        import re
        if not re.match(r"^\d{8}-\d$", value):
            raise serializers.ValidationError(
                "El DUI debe tener el formato: 00000000-0"
            )
        return value

    def validate_email(self, value):
        return value.lower().strip()

    def create(self, validated_data):
        """
        On creation:
          1. Extract username + password
          2. Create the users.User record
          3. Create a matching Django auth.User so they can login via JWT
        """
        from django.contrib.auth.models import User as DjangoUser

        username = validated_data.pop("username", None)
        password = validated_data.pop("password", None)

        if not username:
            raise serializers.ValidationError(
                {"username": "Se requiere un nombre de usuario para login."}
            )
        if not password:
            raise serializers.ValidationError(
                {"password": "Se requiere una contraseña."}
            )

        # Check uniqueness
        if DjangoUser.objects.filter(username=username).exists():
            raise serializers.ValidationError(
                {"username": "Este nombre de usuario ya existe."}
            )

        # Create the app user
        user = User.objects.create(**validated_data)

        # Create the Django auth user (for JWT login)
        DjangoUser.objects.create_user(
            username=username,
            email=user.email,
            password=password,
            first_name=user.nombre,
            last_name=user.apellido,
            is_active=user.is_active,
        )

        return user

    def update(self, instance, validated_data):
        """
        On update:
          - If username/password are provided, update the matching Django auth.User
          - Otherwise just update the app user fields
        """
        from django.contrib.auth.models import User as DjangoUser

        username = validated_data.pop("username", None)
        password = validated_data.pop("password", None)

        # Update the app user
        instance = super().update(instance, validated_data)

        # Sync Django auth user if it exists
        try:
            django_user = DjangoUser.objects.get(email=instance.email)
            django_user.first_name = instance.nombre
            django_user.last_name = instance.apellido
            django_user.is_active = instance.is_active
            if username:
                django_user.username = username
            if password:
                django_user.set_password(password)
            django_user.save()
        except DjangoUser.DoesNotExist:
            # If no Django user exists yet, create one (if username+password given)
            if username and password:
                DjangoUser.objects.create_user(
                    username=username,
                    email=instance.email,
                    password=password,
                    first_name=instance.nombre,
                    last_name=instance.apellido,
                    is_active=instance.is_active,
                )

        return instance

    def to_representation(self, instance):
        """
        Include the Django auth.User username in read responses.
        This allows the frontend to display the login name when editing a user.
        """
        data = super().to_representation(instance)
        from django.contrib.auth.models import User as DjangoUser
        try:
            django_user = DjangoUser.objects.get(email=instance.email)
            data["username"] = django_user.username
        except DjangoUser.DoesNotExist:
            data["username"] = ""
        return data


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

    pin_hash = serializers.CharField(write_only=True, min_length=4, max_length=10)

    class Meta:
        model = PinContingency
        fields = ["id", "user", "pin_hash", "is_active", "created_at", "expires_at"]
        read_only_fields = ["id", "created_at"]

    def validate_pin_hash(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("El PIN debe contener solo números.")
        return value

    def validate_expires_at(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError(
                "La fecha de expiración debe ser en el futuro."
            )
        return value

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        # Hash the PIN before storing it
        validated_data["pin_hash"] = make_password(validated_data["pin_hash"])
        return super().create(validated_data)
