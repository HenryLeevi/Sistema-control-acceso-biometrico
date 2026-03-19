"""apps/biometric/urls.py"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BiometricViewSet

router = DefaultRouter()
router.register(r"", BiometricViewSet, basename="biometric")

urlpatterns = [
    path("", include(router.urls)),
]
