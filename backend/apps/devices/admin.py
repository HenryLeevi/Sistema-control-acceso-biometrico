"""apps/devices/admin.py"""

from django.contrib import admin
from .models import Device


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ["name", "status", "last_seen"]
    list_filter = ["status"]
    readonly_fields = ["id"]
