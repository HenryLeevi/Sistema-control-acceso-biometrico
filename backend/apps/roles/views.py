"""
apps/roles/views.py

ViewSets:
  - RoleViewSet    : CRUD for roles
  - UserRoleViewSet: CRUD for user-role assignments
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Role, UserRole
from .serializers import RoleSerializer, UserRoleSerializer


class RoleViewSet(viewsets.ModelViewSet):
    """CRUD for system roles."""

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]


class UserRoleViewSet(viewsets.ModelViewSet):
    """CRUD for user-role assignments."""

    queryset = UserRole.objects.select_related("user", "role").all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "role"]
