import hashlib
from django.conf import settings

def compute_pin_index(pin: str) -> str:
    """
    Computes a deterministic, searchable hash for a PIN.
    Used for O(1) lookup in the AccessService to avoid the PBKDF2 linear search bottleneck.
    """
    if not pin:
        return None
    # Use SECRET_KEY as a system-wide salt
    salt = settings.SECRET_KEY
    return hashlib.sha256(f"{pin}{salt}".encode()).hexdigest()
