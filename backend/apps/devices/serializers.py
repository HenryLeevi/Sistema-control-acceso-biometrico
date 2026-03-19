"""
apps/devices/serializers.py

Serializers:
  - DeviceSerializer: Raspberry Pi edge device representation
"""

from rest_framework import serializers
from .models import Device


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ["id", "name", "status", "last_seen"]
        read_only_fields = ["id"]
