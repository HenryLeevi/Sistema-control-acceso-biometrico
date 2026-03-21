"""
apps/roles/views.py

ViewSets:
  - RoleViewSet    : CRUD for roles
  - UserRoleViewSet: CRUD for user-role assignments
"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Role, UserRole
from .serializers import RoleSerializer, UserRoleSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Roles"],
        summary="Listar roles del sistema",
        description="Retorna los 4 roles disponibles: `ADMIN`, `SUBADMIN`, `DOCENTE`, `BIOMETRICO`.",
    ),
    create=extend_schema(
        tags=["Roles"],
        summary="Crear rol",
        description="Crea un nuevo rol. Normalmente no es necesario — los 4 roles base ya existen.",
    ),
    retrieve=extend_schema(tags=["Roles"], summary="Obtener rol por ID"),
    update=extend_schema(tags=["Roles"], summary="Actualizar rol"),
    partial_update=extend_schema(tags=["Roles"], summary="Actualizar rol (parcial)"),
    destroy=extend_schema(tags=["Roles"], summary="Eliminar rol"),
)
class RoleViewSet(viewsets.ModelViewSet):
    """CRUD for system roles."""

    queryset = Role.objects.all().order_by("name")
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]


@extend_schema_view(
    list=extend_schema(
        tags=["Roles"],
        summary="Listar asignaciones de rol",
        description=(
            "Retorna todas las asignaciones usuario→rol.\n\n"
            "Filtra por `user` (UUID) o `role` (UUID) para ver los roles de un usuario específico."
        ),
        parameters=[
            OpenApiParameter("user", OpenApiTypes.UUID, description="UUID del usuario"),
            OpenApiParameter("role", OpenApiTypes.UUID, description="UUID del rol"),
        ],
    ),
    create=extend_schema(
        tags=["Roles"],
        summary="Asignar rol a usuario",
        description=(
            "Asigna un rol a un usuario.\n\n"
            "**Body:** `{ \"user\": \"<uuid>\", \"role\": \"<uuid>\" }`"
        ),
    ),
    retrieve=extend_schema(tags=["Roles"], summary="Obtener asignación"),
    update=extend_schema(tags=["Roles"], summary="Actualizar asignación"),
    partial_update=extend_schema(tags=["Roles"], summary="Actualizar asignación (parcial)"),
    destroy=extend_schema(
        tags=["Roles"],
        summary="Remover rol de usuario",
        description="Elimina la asignación de un rol a un usuario.",
    ),
)
class UserRoleViewSet(viewsets.ModelViewSet):
    """CRUD for user-role assignments."""

    queryset = UserRole.objects.select_related("user", "role").all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "role"]
