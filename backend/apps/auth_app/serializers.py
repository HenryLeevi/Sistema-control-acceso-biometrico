"""
apps/auth_app/serializers.py

Custom JWT serializer that adds user info to the token response.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.users.models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends simplejwt's default serializer.

    Accepts: { "username": "...", "password": "..." }
    (matching the frontend's auth-context.tsx login call)

    NOTE: username_field is intentionally left as the default ("username")
    so it works with Django's built-in auth.User created via createsuperuser.

    Phase 2 will implement a custom auth backend that authenticates against
    apps.users.User + Credential using email instead of username.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims here in Phase 2
        return token
