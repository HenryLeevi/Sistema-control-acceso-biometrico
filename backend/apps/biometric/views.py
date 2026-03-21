"""
apps/biometric/views.py

ViewSets:
  - BiometricViewSet: CRUD for biometric enrollment records
"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Biometric
from .serializers import BiometricSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Biometric"],
        summary="Listar registros biométricos",
        description=(
            "Retorna todos los registros de enrolamiento facial en la base de datos.\n\n"
            "**Filtros:** `user` (UUID), `is_active`"
        ),
        parameters=[
            OpenApiParameter("user", OpenApiTypes.UUID, description="UUID del usuario"),
            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Registros activos/inactivos"),
        ],
    ),
    create=extend_schema(
        tags=["Biometric"],
        summary="Crear registro biométrico",
        description=(
            "Registra un enrolamiento facial en el sistema. "
            "El ID de persona de Azure AI Face debe ser proporcionado."
        ),
    ),
    retrieve=extend_schema(tags=["Biometric"], summary="Obtener registro biométrico por ID"),
    update=extend_schema(tags=["Biometric"], summary="Actualizar registro biométrico"),
    partial_update=extend_schema(tags=["Biometric"], summary="Actualizar registro biométrico (parcial)"),
    destroy=extend_schema(tags=["Biometric"], summary="Eliminar registro biométrico"),
)
class BiometricViewSet(viewsets.ModelViewSet):
    """
    CRUD for biometric enrollment records.
    Actual Azure AI Face enrollment is handled at the service layer.
    """

    queryset = Biometric.objects.select_related("user").all().order_by("-is_active", "user__apellido")
    serializer_class = BiometricSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "is_active"]
