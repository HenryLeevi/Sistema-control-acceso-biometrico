"""
apps/access/serializers.py

Serializers:
  - AulaSerializer            : Door management
  - ScheduleSerializer        : Time window
  - AccessPermissionSerializer: User-door-schedule grant
  - AccessEventSerializer     : Read-only audit log
  - AccessValidateSerializer  : Input for POST /api/access/validate/
"""

from rest_framework import serializers
from .models import Aula, Schedule, AccessPermission, AccessEvent, TeacherOTP


class AulaSerializer(serializers.ModelSerializer):
    device_id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Aula
        fields = [
            "id",
            "code",
            "description",
            "is_active",
            "desired_state",
            "actual_state",
            "device_id",
        ]
        read_only_fields = ["id", "device_id"]

    def get_device_id(self, obj):
        try:
            return str(obj.lock.device.id)
        except Exception:
            return None

    def validate(self, data):
        """desired_state and actual_state are independent — no cross-validation needed here."""
        return data


class ScheduleSerializer(serializers.ModelSerializer):
    day_label = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = Schedule
        fields = ["id", "day_of_week", "day_label", "start_time", "end_time", "is_anytime"]
        read_only_fields = ["id", "day_label"]

    def validate(self, data):
        if data.get("start_time") and data.get("end_time"):
            if data["start_time"] >= data["end_time"]:
                raise serializers.ValidationError(
                    "La hora de inicio debe ser anterior a la hora de fin."
                )
        return data


class AccessPermissionSerializer(serializers.ModelSerializer):
    # Read-only display fields for frontend tables
    aula_code = serializers.CharField(source="aula.code", read_only=True)
    aula_description = serializers.CharField(source="aula.description", read_only=True)
    schedule_display = serializers.CharField(source="schedule.__str__", read_only=True)
    schedule_day = serializers.IntegerField(source="schedule.day_of_week", read_only=True)
    schedule_start = serializers.TimeField(source="schedule.start_time", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AccessPermission
        fields = [
            "id", "user", "aula", "schedule", "is_active",
            # read-only display extras
            "aula_code", "aula_description", "schedule_display",
            "schedule_day", "schedule_start",
            "user_email", "user_nombre",
        ]
        read_only_fields = [
            "id", "aula_code", "aula_description", "schedule_display", 
            "schedule_day", "schedule_start", "user_email", "user_nombre"
        ]

    def get_user_nombre(self, obj):
        return f"{obj.user.nombre} {obj.user.apellido}" if obj.user else ""


class AccessEventSerializer(serializers.ModelSerializer):
    """
    Read-only serializer. AccessEvents are created exclusively by the
    service layer — never via direct API POST.
    """

    user_nombre = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    aula_code = serializers.CharField(source="aula.code", read_only=True)

    class Meta:
        model = AccessEvent
        fields = [
            "id",
            "user",
            "user_nombre",
            "user_email",
            "aula",
            "aula_code",
            "device",
            "timestamp",
            "method",
            "result",
            "reason",
            "alert_flag",
            "correlation_id",
        ]
        read_only_fields = fields


# ─────────────────────────────────────────
# Access Validation Input Serializer
# ─────────────────────────────────────────

class AccessValidateSerializer(serializers.Serializer):
    """
    Input schema for POST /api/access/validate/.

    method : FACE | PIN | MANUAL
    data   : Opaque payload (face image URL, PIN string, or manual override token)
    aula_id: UUID of the target door
    """

    METHOD_CHOICES = [
        ("FACE", "Face Recognition"),
        ("PIN", "PIN Contingency"),
        ("OTP", "Teacher OTP"),
        ("MANUAL", "Manual Override"),
    ]

    method = serializers.ChoiceField(choices=METHOD_CHOICES)
    data = serializers.CharField(
        help_text="Opaque authentication payload. Interpretation depends on method.",
    )
    aula_id = serializers.UUIDField()

    def validate_aula_id(self, value):
        from .models import Aula
        if not Aula.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError(
                "El aula especificada no existe o no está activa."
            )
        return value


class TeacherOTPSerializer(serializers.ModelSerializer):
    from .models import TeacherOTP
    class Meta:
        model = TeacherOTP
        fields = ["id", "code", "created_at", "expires_at", "is_used"]
        read_only_fields = ["id", "code", "created_at", "expires_at", "is_used"]
