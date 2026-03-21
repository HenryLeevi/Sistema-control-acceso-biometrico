"""
apps/access/views.py

ViewSets / APIViews:
  - AulaViewSet            : CRUD for doors
  - ScheduleViewSet        : CRUD for time windows
  - AccessPermissionViewSet: CRUD for user-door-schedule grants
  - AccessEventViewSet     : Read-only audit log
  - AccessValidateView     : POST /api/access/validate/ (Raspberry Pi endpoint)
  - KPIView                : GET  /api/access/kpi/
  - ReporteView            : GET  /api/access/reports/summary/
"""

from rest_framework import viewsets, status, mixins, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from .models import Aula, Schedule, AccessPermission, AccessEvent
from .serializers import (
    AulaSerializer,
    ScheduleSerializer,
    AccessPermissionSerializer,
    AccessEventSerializer,
    AccessValidateSerializer,
)
from .services import AccessService, AccessValidationInput, AccessMethod


# ─────────────────────────────────────────
# Aulas
# ─────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=["Access"],
        summary="Listar aulas",
        description=(
            "Retorna todas las aulas/puertas del sistema.\n\n"
            "**Filtros:** `is_active`, `desired_state`, `actual_state`\n"
            "**Búsqueda:** `search` busca por código o descripción"
        ),
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, description="Busca por código o descripción del aula"),
            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Filtra aulas activas/inactivas"),
            OpenApiParameter("desired_state", OpenApiTypes.STR, description="Estado deseado de la puerta"),
            OpenApiParameter("actual_state", OpenApiTypes.STR, description="Estado actual de la puerta"),
        ],
    ),
    create=extend_schema(
        tags=["Access"],
        summary="Crear aula",
        description="Registra una nueva aula/puerta en el sistema.\n\n**Campos requeridos:** `code`, `description`",
    ),
    retrieve=extend_schema(tags=["Access"], summary="Obtener aula por ID"),
    update=extend_schema(tags=["Access"], summary="Actualizar aula (completo)"),
    partial_update=extend_schema(tags=["Access"], summary="Actualizar aula (parcial)"),
    destroy=extend_schema(tags=["Access"], summary="Eliminar aula"),
)
class AulaViewSet(viewsets.ModelViewSet):
    """CRUD for physical doors/classrooms."""

    queryset = Aula.objects.all().order_by("code")
    serializer_class = AulaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["is_active", "desired_state", "actual_state"]
    search_fields = ["code", "description"]


# ─────────────────────────────────────────
# Horarios (Schedule)
# ─────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=["Access"],
        summary="Listar horarios",
        description=(
            "Retorna todos los bloques horarios del sistema.\n\n"
            "**Filtro:** `day_of_week` (0=Lunes … 6=Domingo)"
        ),
        parameters=[
            OpenApiParameter(
                "day_of_week", OpenApiTypes.INT,
                description="Día de la semana: 0=Lunes, 1=Martes, …, 6=Domingo"
            ),
        ],
    ),
    create=extend_schema(
        tags=["Access"],
        summary="Crear horario",
        description=(
            "Registra un bloque horario.\n\n"
            "**Campos requeridos:** `day_of_week` (0–6), `start_time` (HH:MM), `end_time` (HH:MM)"
        ),
    ),
    retrieve=extend_schema(tags=["Access"], summary="Obtener horario por ID"),
    update=extend_schema(tags=["Access"], summary="Actualizar horario (completo)"),
    partial_update=extend_schema(tags=["Access"], summary="Actualizar horario (parcial)"),
    destroy=extend_schema(tags=["Access"], summary="Eliminar horario"),
)
class ScheduleViewSet(viewsets.ModelViewSet):
    """CRUD for weekly schedule time windows."""

    queryset = Schedule.objects.all().order_by("day_of_week", "start_time")
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["day_of_week"]


# ─────────────────────────────────────────
# Permisos de acceso
# ─────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=["Access"],
        summary="Listar permisos de acceso",
        description=(
            "Retorna todas las asignaciones usuario→aula→horario.\n\n"
            "Incluye campos enriquecidos: `user_nombre`, `user_email`, `aula_code`, `schedule_display`.\n\n"
            "**Filtros:** `user` (UUID), `aula` (UUID), `is_active`"
        ),
        parameters=[
            OpenApiParameter("user", OpenApiTypes.UUID, description="UUID del usuario"),
            OpenApiParameter("aula", OpenApiTypes.UUID, description="UUID del aula"),
            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Solo permisos activos/inactivos"),
        ],
    ),
    create=extend_schema(
        tags=["Access"],
        summary="Crear permiso de acceso",
        description=(
            "Otorga acceso a un usuario para un aula en un horario específico.\n\n"
            "**Body:** `{ \"user\": \"<uuid>\", \"aula\": \"<uuid>\", \"schedule\": \"<uuid>\", \"is_active\": true }`"
        ),
    ),
    retrieve=extend_schema(tags=["Access"], summary="Obtener permiso por ID"),
    update=extend_schema(tags=["Access"], summary="Actualizar permiso (completo)"),
    partial_update=extend_schema(tags=["Access"], summary="Actualizar permiso (parcial)"),
    destroy=extend_schema(tags=["Access"], summary="Revocar permiso de acceso"),
)
class AccessPermissionViewSet(viewsets.ModelViewSet):
    """CRUD for user access grants (user → aula → schedule)."""

    queryset = AccessPermission.objects.select_related("user", "aula", "schedule").all()
    serializer_class = AccessPermissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "aula", "is_active"]


# ─────────────────────────────────────────
# Eventos de acceso (read-only audit log)
# ─────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=["Access"],
        summary="Listar eventos de acceso",
        description=(
            "Retorna el registro de auditoría de todos los accesos al sistema. **Solo lectura.**\n\n"
            "Ordenado por timestamp descendente (más reciente primero).\n\n"
            "**Filtros:** `method` (FACE/PIN/MANUAL), `result` (SUCCESS/DENIED), `alert_flag`, `user`, `aula`, `device`\n"
            "**Ordering:** `timestamp`"
        ),
        parameters=[
            OpenApiParameter("method", OpenApiTypes.STR, description="Método: FACE, PIN o MANUAL"),
            OpenApiParameter("result", OpenApiTypes.STR, description="Resultado: SUCCESS o DENIED"),
            OpenApiParameter("alert_flag", OpenApiTypes.BOOL, description="Solo eventos marcados como alerta"),
            OpenApiParameter("user", OpenApiTypes.UUID, description="UUID del usuario"),
            OpenApiParameter("aula", OpenApiTypes.UUID, description="UUID del aula"),
            OpenApiParameter("ordering", OpenApiTypes.STR, description="Ordena por: timestamp, -timestamp"),
        ],
    ),
    retrieve=extend_schema(
        tags=["Access"],
        summary="Obtener evento por ID",
        description="Retorna el detalle de un evento de acceso específico.",
    ),
)
class AccessEventViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only audit log. Creation is done exclusively by AccessService."""

    queryset = AccessEvent.objects.select_related("user", "aula", "device").all()
    serializer_class = AccessEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["user", "aula", "device", "method", "result", "alert_flag"]
    ordering_fields = ["timestamp"]
    ordering = ["-timestamp"]


# ─────────────────────────────────────────
# Validación de acceso (Raspberry Pi)
# ─────────────────────────────────────────

@extend_schema(
    tags=["Access"],
    summary="Validar intento de acceso",
    description=(
        "**Endpoint principal del dispositivo Raspberry Pi.**\n\n"
        "Recibe un intento de acceso biométrico o PIN y retorna si el acceso es permitido o denegado.\n\n"
        "**Métodos:** `FACE` (facial), `PIN` (contingencia), `MANUAL` (apertura manual)\n\n"
        "⚠️ Actualmente retorna `501 Not Implemented` — se implementará en Fase 2."
    ),
    request=AccessValidateSerializer,
    responses={
        200: OpenApiResponse(description="Acceso procesado — incluye `result`, `correlation_id`, `event_id`"),
        400: OpenApiResponse(description="Datos de entrada inválidos"),
        501: OpenApiResponse(description="Lógica de validación pendiente (Fase 2)"),
    },
)
class AccessValidateView(APIView):
    """POST /api/access/validate/ — Used by Raspberry Pi devices."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = AccessValidateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data

        try:
            payload = AccessValidationInput(
                method=AccessMethod(validated["method"]),
                data=validated["data"],
                aula_id=validated["aula_id"],
                device_id=None,
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
# KPI Dashboard
# ─────────────────────────────────────────

@extend_schema(
    tags=["Access"],
    summary="KPIs del dashboard",
    description=(
        "Retorna métricas en tiempo real calculadas desde los eventos de acceso del día actual:\n\n"
        "- `total_accesos_hoy`: total de eventos hoy\n"
        "- `tasa_exito`: % de accesos permitidos\n"
        "- `tasa_rechazo`: % de accesos denegados\n"
        "- `alertas_activas`: eventos con `alert_flag=True` hoy\n"
        "- `usuarios_activos`: total de usuarios activos en el sistema\n"
        "- `accesos_por_hora`: distribución horaria del día\n"
        "- `top_aulas`: top 5 aulas con más accesos"
    ),
    responses={200: OpenApiResponse(description="KPIs calculados exitosamente")},
)
class KPIView(APIView):
    """GET /api/access/kpi/ — Real-time dashboard metrics."""

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
# Reporte mensual
# ─────────────────────────────────────────

@extend_schema(
    tags=["Access"],
    summary="Resumen de reportes (últimos 30 días)",
    description=(
        "Genera un resumen estadístico de los accesos de los últimos 30 días:\n\n"
        "- `total_accesos`: total de eventos en el período\n"
        "- `accesos_permitidos` / `accesos_denegados`: desglose por resultado\n"
        "- `accesos_por_dia`: serie temporal diaria\n"
        "- `accesos_por_metodo`: desglose por método (FACE/PIN/MANUAL)"
    ),
    responses={200: OpenApiResponse(description="Reporte generado exitosamente")},
)
class ReporteView(APIView):
    """GET /api/access/reports/summary/ — Last 30 days report."""

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
