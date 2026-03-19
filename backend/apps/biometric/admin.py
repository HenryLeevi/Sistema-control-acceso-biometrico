"""apps/biometric/admin.py"""

from django.contrib import admin
from .models import Biometric


@admin.register(Biometric)
class BiometricAdmin(admin.ModelAdmin):
    list_display = ["user", "face_id", "is_active", "updated_at"]
    list_filter = ["is_active"]
    readonly_fields = ["id", "updated_at"]
