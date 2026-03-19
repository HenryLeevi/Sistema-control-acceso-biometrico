"""
apps/users/views.py

ViewSets:
  - UserViewSet          : CRUD for users
  - CredentialViewSet    : CRUD for credentials
  - PinContingencyViewSet: CRUD for PIN contingencies
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import User, Credential, PinContingency
from .serializers import UserSerializer, CredentialSerializer, PinContingencySerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for system users.

    Supports filtering by is_active and searching by nombre, apellido, dui, email.
    """

    queryset = User.objects.all().order_by("apellido", "nombre")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["nombre", "apellido", "dui", "email"]
    ordering_fields = ["apellido", "nombre", "created_at"]


class CredentialViewSet(viewsets.ModelViewSet):
    """
    CRUD for user credentials.

    NOTE: In production, credential updates should go through a dedicated
    change-password service endpoint that validates the old password
    and hashes the new one. This ViewSet is provided for admin/scaffold purposes.
    """

    queryset = Credential.objects.select_related("user").all()
    serializer_class = CredentialSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user"]


class PinContingencyViewSet(viewsets.ModelViewSet):
    """CRUD for PIN contingency records."""

    queryset = PinContingency.objects.select_related("user").all()
    serializer_class = PinContingencySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "is_active"]
