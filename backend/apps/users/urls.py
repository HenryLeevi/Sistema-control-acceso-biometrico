"""apps/users/urls.py"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, CredentialViewSet, PinContingencyViewSet

router = DefaultRouter()
router.register(r"credentials", CredentialViewSet, basename="credential")
router.register(r"pins", PinContingencyViewSet, basename="pin-contingency")
router.register(r"", UserViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
]
