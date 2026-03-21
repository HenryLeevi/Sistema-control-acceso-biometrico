"""apps/roles/urls.py"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoleViewSet, UserRoleViewSet

router = DefaultRouter()
router.register(r"assignments", UserRoleViewSet, basename="user-role")
router.register(r"", RoleViewSet, basename="role")

urlpatterns = [
    path("", include(router.urls)),
]
