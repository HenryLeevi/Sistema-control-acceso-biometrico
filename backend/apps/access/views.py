"""
apps/access/views.py

ViewSets / APIViews:
  - AulaViewSet            : CRUD for doors
  - ScheduleViewSet        : CRUD for time windows
  - AccessPermissionViewSet: CRUD for user-door-schedule grants
  - AccessEventViewSet     : Read-only audit log
  - AccessValidateView     : POST /api/access/validate/ (structure + placeholder)
"""

from rest_framework import viewsets, status, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Aula, Schedule, AccessPermission, AccessEvent
from .serializers import (
    AulaSerializer,
    ScheduleSerializer,
    AccessPermissionSerializer,
    AccessEventSerializer,
    AccessValidateSerializer,
)
from .services import AccessService, AccessValidationInput, AccessMethod


class AulaViewSet(viewsets.ModelViewSet):
    """CRUD for physical doors."""

    queryset = Aula.objects.all()
    serializer_class = AulaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["is_active", "desired_state", "actual_state"]
    search_fields = ["code", "description"]


class ScheduleViewSet(viewsets.ModelViewSet):
    """CRUD for weekly schedule time windows."""

    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["day_of_week"]


class AccessPermissionViewSet(viewsets.ModelViewSet):
    """CRUD for user access grants."""

    queryset = AccessPermission.objects.select_related("user", "aula", "schedule").all()
    serializer_class = AccessPermissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "aula", "is_active"]


class AccessEventViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    Read-only audit log of access events.
    Creation is handled exclusively by AccessService — never via this API.
    """

    queryset = AccessEvent.objects.select_related("user", "aula", "device").all()
    serializer_class = AccessEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["user", "aula", "device", "method", "result", "alert_flag"]
    ordering_fields = ["timestamp"]
    ordering = ["-timestamp"]


class AccessValidateView(APIView):
    """
    POST /api/access/validate/

    The PRIMARY endpoint used by Raspberry Pi devices to validate an
    access attempt and receive a door-open/close command.

    Input schema:
    {
        "method":  "FACE | PIN | MANUAL",
        "data":    "<opaque payload>",
        "aula_id": "<UUID>"
    }

    Current status: SCAFFOLDED — returns 501 until Phase 2 implement AccessService.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = AccessValidateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data

        # TODO (Phase 2): Extract device_id from JWT claims
        # device_id = request.auth.get("device_id")

        try:
            # Placeholder — AccessService.validate() raises NotImplementedError
            payload = AccessValidationInput(
                method=AccessMethod(validated["method"]),
                data=validated["data"],
                aula_id=validated["aula_id"],
                device_id=None,  # TODO: extract from JWT
            )
            result = AccessService.validate(payload)
            return Response(
                {
                    "result": result.result.value,
                    "correlation_id": str(result.correlation_id),
                    "event_id": str(result.event_id),
                    "reason": result.reason,
                },
                status=status.HTTP_200_OK,
            )
        except NotImplementedError:
            return Response(
                {
                    "status": "not_implemented",
                    "message": (
                        "Access validation logic is a Phase 2 implementation target. "
                        "Input schema was validated successfully."
                    ),
                    "validated_input": {
                        "method": validated["method"],
                        "aula_id": str(validated["aula_id"]),
                    },
                },
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )


# ─────────────────────────────────────────
# Dashboard KPI: GET /api/access/kpi/
# ─────────────────────────────────────────

class KPIView(APIView):
    """
    GET /api/access/kpi/

    Computes real-time KPIs from the AccessEvent table.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        from django.utils import timezone
        from django.db.models import Count
        from django.db.models.functions import TruncHour
        from apps.users.models import User

        today = timezone.now().date()
        events_today = AccessEvent.objects.filter(timestamp__date=today)

        total = events_today.count()
        success = events_today.filter(result="SUCCESS").count()
        denied = events_today.filter(result="DENIED").count()

        by_hour = (
            events_today
            .annotate(hora_trunc=TruncHour("timestamp"))
            .values("hora_trunc")
            .annotate(cantidad=Count("id"))
            .order_by("hora_trunc")
        )
        accesos_por_hora = [
            {"hora": f"{item['hora_trunc'].hour:02d}:00", "cantidad": item["cantidad"]}
            for item in by_hour if item["hora_trunc"]
        ]

        top_aulas = (
            events_today
            .values("aula__code")
            .annotate(cantidad=Count("id"))
            .order_by("-cantidad")[:5]
        )

        return Response({
            "total_accesos_hoy": total,
            "tasa_exito": round(success / total * 100, 1) if total else 0,
            "tasa_rechazo": round(denied / total * 100, 1) if total else 0,
            "alertas_activas": events_today.filter(alert_flag=True).count(),
            "usuarios_activos": User.objects.filter(is_active=True).count(),
            "accesos_por_hora": accesos_por_hora,
            "top_aulas": [
                {"aula": item["aula__code"] or "N/A", "cantidad": item["cantidad"]}
                for item in top_aulas
            ],
        })


# ─────────────────────────────────────────
# Reporte: GET /api/access/reports/summary/
# ─────────────────────────────────────────

class ReporteView(APIView):
    """
    GET /api/access/reports/summary/

    Returns a report summary of the last 30 days.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        from django.utils import timezone
        from django.db.models import Count, Q
        from django.db.models.functions import TruncDate
        from datetime import timedelta

        end = timezone.now()
        start = end - timedelta(days=30)

        events = AccessEvent.objects.filter(timestamp__range=(start, end))
        total = events.count()
        permitidos = events.filter(result="SUCCESS").count()
        denegados = events.filter(result="DENIED").count()

        por_dia = (
            events.annotate(fecha=TruncDate("timestamp"))
            .values("fecha")
            .annotate(
                permitidos=Count("id", filter=Q(result="SUCCESS")),
                denegados=Count("id", filter=Q(result="DENIED")),
            )
            .order_by("fecha")
        )

        por_metodo = events.values("method").annotate(cantidad=Count("id"))

        return Response({
            "periodo": f"{start.date()} / {end.date()}",
            "total_accesos": total,
            "accesos_permitidos": permitidos,
            "accesos_denegados": denegados,
            "tasa_puntualidad": 0,
            "accesos_por_dia": [
                {"fecha": str(item["fecha"]), "permitidos": item["permitidos"], "denegados": item["denegados"]}
                for item in por_dia
            ],
            "accesos_por_metodo": [
                {"metodo": item["method"], "cantidad": item["cantidad"]}
                for item in por_metodo
            ],
            "heatmap": [],
            "usuarios_mas_activos": [],
        })

