"""apps/devices/servo_urls.py — Raspberry Pi servo endpoint."""

from django.urls import path
from .views import ServoActivateView

urlpatterns = [
    path("activate/", ServoActivateView.as_view(), name="servo-activate"),
]
