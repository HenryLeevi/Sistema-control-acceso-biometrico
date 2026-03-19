"""
apps/access/services.py

Service layer for access validation logic.

This module defines the interface for the core access validation flow.
Business logic is NOT implemented here yet — this is a structured placeholder
that  defines the service contract for Phase 2 implementation.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional
import uuid


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
        """
        Validate an access attempt and return the result.

        THIS METHOD IS NOT YET IMPLEMENTED.
        Returns a structured placeholder response.

        Args:
            payload: AccessValidationInput with method, data, and aula_id.

        Returns:
            AccessValidationOutput with result, audit info, and event ID.

        Raises:
            NotImplementedError: Always, until Phase 2 is implemented.
        """
        raise NotImplementedError(
            "AccessService.validate() is a Phase 2 implementation target. "
            "See the docstring for the full specification."
        )
