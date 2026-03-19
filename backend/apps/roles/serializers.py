"""
apps/roles/serializers.py

Serializers:
  - RoleSerializer    : Role name (choices validated)
  - UserRoleSerializer: User-role assignment
"""

from rest_framework import serializers
from .models import Role, UserRole


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name"]
        read_only_fields = ["id"]


class UserRoleSerializer(serializers.ModelSerializer):
    """
    Nested read representation includes role name for convenience.
    Write operations use IDs only (user, role).
    """

    role_name = serializers.CharField(source="role.get_name_display", read_only=True)

    class Meta:
        model = UserRole
        fields = ["id", "user", "role", "role_name"]
        read_only_fields = ["id", "role_name"]

    def validate(self, data):
        """Prevent duplicate user-role assignments."""
        if UserRole.objects.filter(
            user=data.get("user"), role=data.get("role")
        ).exists():
            raise serializers.ValidationError(
                "Este usuario ya tiene asignado este rol."
            )
        return data
