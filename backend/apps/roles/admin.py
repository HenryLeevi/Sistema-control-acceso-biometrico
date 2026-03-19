"""apps/roles/admin.py"""

from django.contrib import admin
from .models import Role, UserRole


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["name"]
    readonly_fields = ["id"]


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ["user", "role"]
    list_filter = ["role"]
    readonly_fields = ["id"]
