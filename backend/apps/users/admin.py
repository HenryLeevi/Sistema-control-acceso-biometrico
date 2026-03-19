"""apps/users/admin.py"""

from django.contrib import admin
from .models import User, Credential, PinContingency


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["full_name", "dui", "email", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["nombre", "apellido", "dui", "email"]
    readonly_fields = ["id", "created_at"]


@admin.register(Credential)
class CredentialAdmin(admin.ModelAdmin):
    list_display = ["user", "updated_at"]
    readonly_fields = ["id", "updated_at"]
    # password_hash is excluded for security
    exclude = ["password_hash"]


@admin.register(PinContingency)
class PinContingencyAdmin(admin.ModelAdmin):
    list_display = ["user", "is_active", "created_at", "expires_at"]
    list_filter = ["is_active"]
    readonly_fields = ["id", "created_at"]
    exclude = ["pin_hash"]
