"""
apps/devices/views.py

ViewSets / APIViews:
  - DeviceViewSet : CRUD for Raspberry Pi devices
  - ServoActivateView: Stub endpoint for Raspberry Pi servo control
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Device
from .serializers import DeviceSerializer


class DeviceViewSet(viewsets.ModelViewSet):
    """CRUD for physical edge devices (Raspberry Pi)."""

    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]


class ServoActivateView(APIView):
    """
    POST /api/servo/activate/

    Stub endpoint for the Raspberry Pi to:
      1. Receive a JWT-authenticated command
      2. Execute servo/door action
      3. Report back device status

    IMPORTANT — Responsibilities of the device (NOT backend):
      - No users, roles, permissions, or biometric logic
      - Execution only: open/close the servomotor on command
      - Update device.last_seen and device.status

    TODO (Phase 2):
      - Validate JWT and extract device identity
      - Parse aula_id and desired action (OPEN / CLOSED)
      - Actually execute servo command (Raspberry Pi-side implementation)
      - Update Device.last_seen and Aula.actual_state
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
        # --- Placeholder implementation ---
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
