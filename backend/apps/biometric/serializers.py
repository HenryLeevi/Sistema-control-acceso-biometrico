"""
apps/biometric/serializers.py

Serializers:
  - BiometricSerializer: Azure Face enrollment reference
"""

from rest_framework import serializers
from .models import Biometric


class BiometricSerializer(serializers.ModelSerializer):
    """
    face_id and storage_url are set by the service layer after interacting with
    Azure AI Face and Azure Blob Storage. The API surface here is used for
    admin review and enrollment management.
    """

    class Meta:
        model = Biometric
        fields = ["id", "user", "face_id", "storage_url", "is_active", "updated_at"]
        read_only_fields = ["id", "updated_at"]

    def validate(self, data):
        """
        Warn if user already has an active biometric record.
        Service layer should deactivate previous records before creating a new active one.
        """
        if data.get("is_active", True):
            existing_active = Biometric.objects.filter(
                user=data.get("user"), is_active=True
            )
            # On update, exclude the current instance
            if self.instance:
                existing_active = existing_active.exclude(pk=self.instance.pk)
            if existing_active.exists():
                raise serializers.ValidationError(
                    "El usuario ya tiene un registro biométrico activo. "
                    "Desactive el anterior antes de crear uno nuevo."
                )
        return data
