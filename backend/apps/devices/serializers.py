"""
apps/devices/serializers.py

Serializers:
  - DeviceSerializer: Raspberry Pi edge device representation
  - LockSerializer  : Lock configuration and state
"""

from rest_framework import serializers
from .models import Device, Lock


class LockSerializer(serializers.ModelSerializer):
    aula_code = serializers.CharField(source="aula.code", read_only=True)
    device_name = serializers.CharField(source="device.name", read_only=True)

    class Meta:
        model = Lock
        fields = [
            "id", "name", "device", "device_name", "aula", "aula_code",
            "gpio_pin", "lock_type", "open_duration", "is_active", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "aula_code", "device_name"]


class DeviceSerializer(serializers.ModelSerializer):
    locks = LockSerializer(many=True, read_only=True)

    class Meta:
        model = Device
        fields = [
            "id", "name", "model", "serial_number", 
            "description", "status", "last_seen", "locks"
        ]
        read_only_fields = ["id", "last_seen", "locks"]
