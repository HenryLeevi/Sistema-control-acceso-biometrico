"""apps/devices/urls.py"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeviceViewSet, ServoActivateView

router = DefaultRouter()
router.register(r"", DeviceViewSet, basename="device")

urlpatterns = [
    path("", include(router.urls)),
    path("servo/activate/", ServoActivateView.as_view(), name="servo-activate"),
]
