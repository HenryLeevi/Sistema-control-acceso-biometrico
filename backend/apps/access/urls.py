"""apps/access/urls.py"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AulaViewSet,
    ScheduleViewSet,
    AccessPermissionViewSet,
    AccessEventViewSet,
    AccessValidateView,
    KPIView,
    ReporteView,
    TeacherOTPViewSet,
)

router = DefaultRouter()
router.register(r"aulas", AulaViewSet, basename="aula")
router.register(r"schedules", ScheduleViewSet, basename="schedule")
router.register(r"permissions", AccessPermissionViewSet, basename="access-permission")
router.register(r"events", AccessEventViewSet, basename="access-event")
router.register(r"otps", TeacherOTPViewSet, basename="teacher-otp")

urlpatterns = [
    path("", include(router.urls)),
    # Core validation endpoint (POST only)
    path("validate/", AccessValidateView.as_view(), name="access-validate"),
    # Dashboard KPI
    path("kpi/", KPIView.as_view(), name="access-kpi"),
    # Reports
    path("reports/summary/", ReporteView.as_view(), name="access-report-summary"),
]
