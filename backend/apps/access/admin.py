"""apps/access/admin.py"""

from django.contrib import admin
from .models import Aula, Schedule, AccessPermission, AccessEvent


@admin.register(Aula)
class AulaAdmin(admin.ModelAdmin):
    list_display = ["code", "description", "is_active", "desired_state", "actual_state"]
    list_filter = ["is_active", "desired_state", "actual_state"]
    search_fields = ["code", "description"]
    readonly_fields = ["id"]


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ["day_of_week", "start_time", "end_time"]
    list_filter = ["day_of_week"]
    readonly_fields = ["id"]


@admin.register(AccessPermission)
class AccessPermissionAdmin(admin.ModelAdmin):
    list_display = ["user", "aula", "schedule", "is_active"]
    list_filter = ["is_active", "aula"]
    readonly_fields = ["id"]


@admin.register(AccessEvent)
class AccessEventAdmin(admin.ModelAdmin):
    """
    AccessEvents are immutable audit records.
    All fields are read-only in the admin to enforce append-only semantics.
    """

    list_display = ["timestamp", "user", "aula", "device", "method", "result", "alert_flag"]
    list_filter = ["method", "result", "alert_flag"]
    search_fields = ["user__nombre", "user__apellido", "correlation_id"]
    readonly_fields = [
        "id", "user", "aula", "device", "timestamp",
        "method", "result", "reason", "alert_flag", "correlation_id",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
