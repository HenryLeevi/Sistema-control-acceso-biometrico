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
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


class AccessMethod(str, Enum):
    FACE = "FACE"
    PIN = "PIN"
    OTP = "OTP"
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
                        # Double check: confirm user exists AND has an active biometric enrollment
                        from apps.biometric.models import Biometric
                        user = User.objects.filter(id=found_user_id, is_active=True).first()
                        if not user:
                            reason = "Rostro reconocido pero el usuario está inactivo o no existe en DB local."
                        else:
                            # Verify local enrollment status
                            if not Biometric.objects.filter(user=user, is_active=True).exists():
                                user = None # Revoke identification
                                reason = "El usuario no tiene un enrolamiento biométrico activo en este momento."
                    else:
                        reason = "Rostro no reconocido en el sistema."
                except Exception as e:
                    reason = f"Error procesando imagen facial: {e}"
                    alert_flag = True
                    
            elif payload.method == AccessMethod.PIN:
                # payload.data contains the plain text PIN
                now = timezone.now()
                active_pins = PinContingency.objects.filter(is_active=True, expires_at__gt=now).select_related("user")
                logger.info(f"PIN Validation: Found {active_pins.count()} active PINs to check.")
                
                for pin_record in active_pins:
                    match = False
                    try:
                        # 1. Try secure Django hashing
                        match = check_password(payload.data, pin_record.pin_hash)
                        logger.debug(f"PIN Match check for user {pin_record.user.email}: {match}")
                    except Exception as e:
                        # 2. Fallback to plain text comparison for legacy/unhashed PINs
                        logger.warning(f"check_password failed for user {pin_record.user.email}, falling back to plain text check: {e}")
                        match = (payload.data == pin_record.pin_hash)
                    
                    if match:
                        user = pin_record.user
                        logger.info(f"PIN Validation Successful for user: {user.email}")
                        break
                        
                if not user:
                    reason = "PIN inválido o expirado."

            elif payload.method == AccessMethod.OTP:
                # payload.data contains the 6-digit OTP code
                from apps.access.models import TeacherOTP
                now = timezone.now()
                otp_record = TeacherOTP.objects.filter(
                    code=payload.data,
                    is_used=False,
                    expires_at__gt=now
                ).select_related("user").first()
                
                if otp_record:
                    user = otp_record.user
                    # Mark as used immediately to prevent reuse
                    otp_record.is_used = True
                    otp_record.save()
                else:
                    reason = "Código OTP inválido, ya usado o expirado."
                    
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
                
                # 2.1 Check for active permissions
                permissions = AccessPermission.objects.filter(
                    user=user,
                    aula=aula,
                    is_active=True
                )
                
                valid_access = False
                for perm in permissions:
                    sched = perm.schedule
                    # Check if it's an "Anytime" schedule or if it matches the current time/day
                    if sched.is_anytime:
                        valid_access = True
                        break
                    if sched.day_of_week == current_day and \
                       sched.start_time <= current_time <= sched.end_time:
                        valid_access = True
                        break
                
                if valid_access:
                    result = AccessResult.SUCCESS
                    # Trigger device to open
                    aula.desired_state = Aula.DoorState.OPEN
                    aula.save()
                    
                    # Emit WebSocket event to the device channel
                    try:
                        from apps.devices.models import Lock
                        lock = Lock.objects.filter(aula=aula, is_active=True).first()
                        if lock:
                            channel_layer = get_channel_layer()
                            group_name = f"device_{lock.device.id}"
                            
                            async_to_sync(channel_layer.group_send)(
                                group_name,
                                {
                                    "type": "device_command",
                                    "payload": {
                                        "action": "OPEN_DOOR",
                                        "lock_id": str(lock.id),
                                        "aula_code": aula.code,
                                        "gpio_pin": lock.gpio_pin,
                                        "duration": 5  # Seconds to stay open
                                    }
                                }
                            )
                            logger.info(f"Sent OPEN_DOOR command to device {lock.device.id} for Aula {aula.code}")
                    except Exception as ws_err:
                        logger.error(f"Failed to emit WebSocket command: {ws_err}")
                else:
                    reason = "Usuario identificado pero no tiene permiso activo para esta Aula en este horario."
                    
        except Exception as e:
            reason = f"Unexpected error during validation: {e}"
            alert_flag = True
            logger.error(reason)

        # 3. Log Audit Event
        event_id = uuid.uuid4()
        
        # Fallback for device if not provided (rare if coming from Pi)
        d_id = payload.device_id
        if not d_id:
            from apps.devices.models import Device
            dev_obj = Device.objects.first()
            if dev_obj:
                d_id = dev_obj.id
            else:
                logger.warning("Access attempt without a registered device.")

        if d_id:
            try:
                event = AccessEvent.objects.create(
                    user=user,
                    aula_id=aula.id if aula else None,
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
