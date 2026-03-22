"""
apps/devices/views.py

ViewSets / APIViews:
  - DeviceViewSet : CRUD for Raspberry Pi devices
  - ServoActivateView: Stub endpoint for Raspberry Pi servo control
"""

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from .models import Device, Lock
from .serializers import DeviceSerializer, LockSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Devices"],
        summary="Listar dispositivos IoT",
        description="Retorna la lista de todas las Raspberry Pi registradas en el sistema.",
    ),
    create=extend_schema(
        tags=["Devices"],
        summary="Registrar dispositivo",
        description="Registra una nueva Raspberry Pi. El `device_id` debe ser único.",
    ),
    retrieve=extend_schema(tags=["Devices"], summary="Obtener dispositivo por ID"),
    update=extend_schema(tags=["Devices"], summary="Actualizar dispositivo (completo)"),
    partial_update=extend_schema(tags=["Devices"], summary="Actualizar dispositivo (parcial)"),
    destroy=extend_schema(tags=["Devices"], summary="Eliminar dispositivo"),
)
class DeviceViewSet(viewsets.ModelViewSet):
    """CRUD for physical edge devices (Raspberry Pi)."""

    queryset = Device.objects.all().prefetch_related("locks").order_by("name")
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]


@extend_schema_view(
    list=extend_schema(tags=["Devices"], summary="Listar cerraduras"),
    create=extend_schema(tags=["Devices"], summary="Registrar cerradura"),
    retrieve=extend_schema(tags=["Devices"], summary="Obtener cerradura por ID"),
    update=extend_schema(tags=["Devices"], summary="Actualizar cerradura"),
    destroy=extend_schema(tags=["Devices"], summary="Eliminar cerradura"),
)
class LockViewSet(viewsets.ModelViewSet):
    """CRUD for physical locks (Servos)."""
    queryset = Lock.objects.all().select_related("aula", "device")
    serializer_class = LockSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(
    tags=["Devices"],
    summary="Activar servomotor / Abrir puerta",
    description=(
        "**Endpoint de ejecución para el dispositivo (Raspberry Pi).**\n\n"
        "Envía el comando de apertura o cierre a un aula específica.\n\n"
        "⚠️ Actualmente retorna `501 Not Implemented` — se implementará en Fase 2 "
        "con la integración física de la Raspberry Pi."
    ),
    responses={
        200: OpenApiResponse(description="Comando recibido y procesado por el dispositivo"),
        501: OpenApiResponse(description="Integración física pendiente (Fase 2)"),
    },
)
class ServoActivateView(APIView):
    """
    POST /api/devices/servo/activate/
    
    Stub endpoint for the Raspberry Pi to execute servo actions.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """
        Expected input:
        {
            "device_id": "UUID",
            "aula_id":   "UUID",
            "action":    "OPEN | CLOSED"
        }
        """
        return Response(
            {
                "status": "not_implemented",
                "message": (
                    "Servo activation endpoint is scaffolded. "
                    "Full implementation pending Phase 2 (Raspberry Pi integration)."
                ),
                "received": request.data,
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
