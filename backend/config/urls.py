"""
Root URL configuration for the Biometric Access Control System.

All application routes are prefixed with /api/.
Swagger UI is served at /api/swagger/.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # ── Swagger / OpenAPI docs ────────────
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # ── API routes ─────────────────────────
    path("api/users/", include("apps.users.urls")),
    path("api/roles/", include("apps.roles.urls")),
    path("api/biometric/", include("apps.biometric.urls")),
    path("api/devices/", include("apps.devices.urls")),
    path("api/access/", include("apps.access.urls")),
    path("api/auth/", include("apps.auth_app.urls")),
]
