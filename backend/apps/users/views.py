"""
apps/users/views.py

ViewSets:
  - UserViewSet          : CRUD for users (with search & filter)
  - CredentialViewSet    : CRUD for credentials
  - PinContingencyViewSet: CRUD for PIN contingencies
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import User, Credential, PinContingency
from .serializers import UserSerializer, CredentialSerializer, PinContingencySerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Users"],
        summary="Listar usuarios",
        description=(
            "Retorna la lista paginada de todos los usuarios del sistema.\n\n"
            "**Filtros opcionales:**\n"
            "- `search`: busca por nombre, apellido, DUI o email\n"
            "- `is_active`: filtra por estado (true/false)\n"
            "- `ordering`: ordena por `apellido`, `nombre` o `created_at`"
        ),
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, description="Busca por nombre, apellido, DUI o email"),
            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Filtra por estado activo/inactivo"),
            OpenApiParameter("ordering", OpenApiTypes.STR, description="Ordena por: apellido, nombre, created_at"),
            OpenApiParameter("page", OpenApiTypes.INT, description="Número de página"),
        ],
    ),
    create=extend_schema(
        tags=["Users"],
        summary="Crear usuario",
        description=(
            "Crea un nuevo usuario en el sistema y genera un `auth.User` de Django "
            "para que el usuario pueda hacer login con JWT.\n\n"
            "**Campos requeridos:** `nombre`, `apellido`, `email`, `username`, `password`\n"
            "**Campos opcionales:** `dui` (formato 00000000-0), `fecha_nacimiento`, `residencia`"
        ),
    ),
    retrieve=extend_schema(
        tags=["Users"],
        summary="Obtener usuario por ID",
        description="Retorna los datos de un usuario específico por su UUID.",
    ),
    update=extend_schema(
        tags=["Users"],
        summary="Actualizar usuario (completo)",
        description="Reemplaza todos los campos de un usuario. Usa PATCH para actualizaciones parciales.",
    ),
    partial_update=extend_schema(
        tags=["Users"],
        summary="Actualizar usuario (parcial)",
        description=(
            "Actualiza campos específicos de un usuario.\n\n"
            "Si se envía `username` o `password`, se actualizan también en el `auth.User` de Django."
        ),
    ),
    destroy=extend_schema(
        tags=["Users"],
        summary="Eliminar usuario",
        description="Elimina un usuario del sistema de forma permanente.",
    ),
)
class UserViewSet(viewsets.ModelViewSet):
    """CRUD for system users."""

    queryset = User.objects.all().order_by("apellido", "nombre")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["nombre", "apellido", "dui", "email"]
    ordering_fields = ["apellido", "nombre", "created_at"]

    def destroy(self, request, *args, **kwargs):
        from django.contrib.auth.models import User as DjangoUser
        from rest_framework.response import Response
        from rest_framework import status
        
        instance = self.get_object()
        
        # 1. Delete associated Django auth.User if it exists
        try:
            django_user = DjangoUser.objects.get(email=instance.email)
            django_user.delete()
        except DjangoUser.DoesNotExist:
            pass
            
        # 2. Delete the custom App User
        self.perform_destroy(instance)
        
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        tags=["Users"],
        summary="Listar credenciales",
        description="Retorna credenciales. El campo `password_hash` nunca es expuesto en respuestas.",
        parameters=[
            OpenApiParameter("user", OpenApiTypes.UUID, description="Filtra por UUID del usuario"),
        ],
    ),
    create=extend_schema(
        tags=["Users"],
        summary="Crear credencial",
        description="Crea una credencial para un usuario. El hash debe calcularse antes de enviar.",
    ),
    retrieve=extend_schema(tags=["Users"], summary="Obtener credencial"),
    update=extend_schema(tags=["Users"], summary="Actualizar credencial"),
    partial_update=extend_schema(tags=["Users"], summary="Actualizar credencial (parcial)"),
    destroy=extend_schema(tags=["Users"], summary="Eliminar credencial"),
)
class CredentialViewSet(viewsets.ModelViewSet):
    """CRUD for user credentials. password_hash is write-only."""

    queryset = Credential.objects.select_related("user").all()
    serializer_class = CredentialSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user"]


@extend_schema_view(
    list=extend_schema(
        tags=["Users"],
        summary="Listar PINs de contingencia",
        description="Lista los PINs de acceso de emergencia. El `pin_hash` no se expone.",
        parameters=[
            OpenApiParameter("user", OpenApiTypes.UUID, description="Filtra por UUID del usuario"),
            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Filtra por PINs activos/inactivos"),
        ],
    ),
    create=extend_schema(
        tags=["Users"],
        summary="Crear PIN de contingencia",
        description="Crea un PIN de emergencia para un usuario. `expires_at` debe ser una fecha futura.",
    ),
    retrieve=extend_schema(tags=["Users"], summary="Obtener PIN"),
    update=extend_schema(tags=["Users"], summary="Actualizar PIN"),
    partial_update=extend_schema(tags=["Users"], summary="Actualizar PIN (parcial)"),
    destroy=extend_schema(tags=["Users"], summary="Eliminar PIN"),
)
class PinContingencyViewSet(viewsets.ModelViewSet):
    """CRUD for PIN contingency records."""

    queryset = PinContingency.objects.select_related("user").all()
    serializer_class = PinContingencySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "is_active"]
