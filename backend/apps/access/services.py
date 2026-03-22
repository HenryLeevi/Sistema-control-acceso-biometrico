"""
apps/access/services.py

Service layer for access validation logic.

This module defines the interface for the core access validation flow.
Business logic is NOT implemented here yet — this is a structured placeholder
that  defines the service contract for Phase 2 implementation.
"""

import uuid
import base64
import io
import logging
from typing import Optional
from dataclasses import dataclass
from enum import Enum
from django.utils import timezone
from django.contrib.auth.hashers import check_password

logger = logging.getLogger(__name__)


class AccessMethod(str, Enum):
    FACE = "FACE"
    PIN = "PIN"
    MANUAL = "MANUAL"


class AccessResult(str, Enum):
    SUCCESS = "SUCCESS"
    DENIED = "DENIED"


@dataclass
class AccessValidationInput:
    """Input to the access validation service."""

    method: AccessMethod
    data: str           # Opaque payload: face image URL, PIN string, or manual token
    aula_id: uuid.UUID
    device_id: uuid.UUID  # Extracted from JWT — set by the view


@dataclass
class AccessValidationOutput:
    """Output from the access validation service."""

    result: AccessResult
    user_id: Optional[uuid.UUID]
    user_full_name: Optional[str]
    reason: Optional[str]
    alert_flag: bool
    correlation_id: uuid.UUID
    event_id: uuid.UUID  # ID of the created AccessEvent


class AccessService:
    """
    Core access validation service.

    Phase 2 implementation will:
      1. Identify the user from the input payload:
           FACE   → Call Azure AI Face to match face against enrolled biometrics
           PIN    → Hash the input PIN and compare against PinContingency records
           MANUAL → Validate a signed override token (admin-issued)
      2. Verify the identified user has a valid, active AccessPermission
         for the requested aula at the current day and time (Schedule check).
      3. If permitted, command the device to open the door:
           - Set Aula.desired_state = OPEN
           - Emit WebSocket event to the device channel
      4. Create an immutable AccessEvent audit record regardless of outcome.
      5. Set alert_flag for suspicious patterns (repeated denials, off-hours, etc.)
    """

    @staticmethod
    def validate(payload: AccessValidationInput) -> AccessValidationOutput:
        from apps.users.models import User, PinContingency
        from apps.biometric.models import Biometric
        from apps.access.models import Aula, AccessPermission, AccessEvent, Schedule
        from apps.biometric.services.aws_rekognition import search_face_by_image
        
        user = None
        reason = None
        alert_flag = False
        result = AccessResult.DENIED
        
        correlation_id = uuid.uuid4()
        
        try:
            # 1. Identify User
            if payload.method == AccessMethod.FACE:
                try:
                    # Decode base64 image from device
                    image_data = base64.b64decode(payload.data)
                    
                    found_user_id = search_face_by_image(image_data)
                    if found_user_id:
                        user = User.objects.filter(id=found_user_id, is_active=True).first()
                        if not user:
                            reason = "Rostro reconocido pero el usuario está inactivo o no existe en DB local."
                    else:
                        reason = "Rostro no reconocido en el sistema."
                except Exception as e:
                    reason = f"Error procesando imagen facial: {e}"
                    alert_flag = True
                    
            elif payload.method == AccessMethod.PIN:
                # payload.data contains the plain text PIN
                now = timezone.now()
                active_pins = PinContingency.objects.filter(is_active=True, expires_at__gt=now).select_related("user")
                
                for pin_record in active_pins:
                    match = False
                    try:
                        # 1. Try secure Django hashing
                        match = check_password(payload.data, pin_record.pin_hash)
                    except Exception:
                        # 2. Fallback to plain text comparison for legacy/unhashed PINs
                        match = (payload.data == pin_record.pin_hash)
                    
                    if match:
                        user = pin_record.user
                        break
                        
                if not user:
                    reason = "PIN inválido o expirado."
                    
            elif payload.method == AccessMethod.MANUAL:
                # Placeholder for manual override
                reason = "Manual override strictly requires admin signature (Not Implemented)."
                alert_flag = True

            # 2. Verify AccessPermission if user identified
            aula = Aula.objects.filter(id=payload.aula_id).first()
            if not aula:
                reason = "Aula not found."
                
            if user and aula and not reason:
                now_time = timezone.localtime(timezone.now())
                current_time = now_time.time()
                current_day = now_time.weekday() # 0 = Monday
                
                # Check for active permissions overlapping current day and time
                permissions = AccessPermission.objects.filter(
                    user=user,
                    aula=aula,
                    is_active=True,
                    schedule__day_of_week=current_day,
                    schedule__start_time__lte=current_time,
                    schedule__end_time__gte=current_time
                )
                
                if permissions.exists():
                    result = AccessResult.SUCCESS
                    # Trigger device to open
                    aula.desired_state = Aula.DoorState.OPEN
                    aula.save()
                    # TODO: Emit WebSocket event to the device channel here if implemented
                else:
                    reason = "Usuario identificado pero no tiene permiso activo para esta Aula en este horario."
                    
        except Exception as e:
            reason = f"Unexpected error during validation: {e}"
            alert_flag = True
            logger.error(reason)

        # 3. Log Audit Event
        event_id = uuid.uuid4()
        if aula:
            from apps.devices.models import Device
            d_id = payload.device_id
            if not d_id:
                dev_obj = Device.objects.first()
                if not dev_obj:
                    dev_obj, _ = Device.objects.get_or_create(name="Virtual Demo Device", defaults={"status": "ONLINE"})
                d_id = dev_obj.id

            try:
                event = AccessEvent.objects.create(
                    user=user,
                    aula_id=aula.id,
                    device_id=d_id,
                    method=payload.method.value,
                    result=result.value,
                    reason=reason,
                    alert_flag=alert_flag,
                    correlation_id=correlation_id
                )
                event_id = event.id
            except Exception as e:
                logger.error(f"Failed to log AccessEvent: {e}")

        return AccessValidationOutput(
            result=result,
            user_id=user.id if user else None,
            user_full_name=user.full_name if user else None,
            reason=reason,
            alert_flag=alert_flag,
            correlation_id=correlation_id,
            event_id=event_id
        )
