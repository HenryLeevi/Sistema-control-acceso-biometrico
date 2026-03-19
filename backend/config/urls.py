"""
Root URL configuration for the Biometric Access Control System.

All application routes are prefixed with /api/.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # ── API routes ─────────────────────────
    path("api/users/", include("apps.users.urls")),
    path("api/roles/", include("apps.roles.urls")),
    path("api/biometric/", include("apps.biometric.urls")),
    path("api/devices/", include("apps.devices.urls")),
    path("api/access/", include("apps.access.urls")),
    path("api/servo/", include("apps.devices.servo_urls")),
    path("api/auth/", include("apps.auth_app.urls")),
]
