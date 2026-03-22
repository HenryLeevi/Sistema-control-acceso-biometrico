"""
apps/auth_app/views.py

JWT Authentication endpoints:
  POST /api/auth/login/   → obtain access + refresh tokens (+ user data)
  POST /api/auth/refresh/ → refresh an expired access token
  GET  /api/auth/me/      → get currently authenticated user profile
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .serializers import CustomTokenObtainPairSerializer


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/

    Accepts: { "username": "...", "password": "..." }
    Returns: { "access": "...", "refresh": "...", "user": {...}, "roles": [...] }
    """

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        token_data = serializer.validated_data
        django_user = serializer.user

        # Fetch real roles from the UserRole model via email match
        roles = []
        try:
            from apps.users.models import User as AppUser
            from apps.roles.models import UserRole
            app_user = AppUser.objects.get(email=django_user.email)
            roles = list(
                UserRole.objects.filter(user=app_user)
                .select_related("role")
                .values_list("role__name", flat=True)
            )
        except Exception:
            # Fallback: superusers get admin role
            if django_user.is_superuser:
                roles = ["ADMIN"]

        user_data = {
            "id": str(django_user.pk),
            "username": django_user.username,
            "email": django_user.email,
            "nombre": django_user.first_name or django_user.username,
            "apellido": django_user.last_name or "",
            "is_active": django_user.is_active,
            "created_at": django_user.date_joined.isoformat(),
            "roles": roles,
            "local_user_id": str(app_user.id) if 'app_user' in locals() else None,
        }

        return Response(
            {
                **token_data,
                "user": user_data,
                "roles": roles,
            },
            status=status.HTTP_200_OK,
        )


class RefreshView(TokenRefreshView):
    """
    POST /api/auth/refresh/

    Accepts: { "refresh": "..." }
    Returns: { "access": "..." }
    """

    pass


class MeView(APIView):
    """
    GET /api/auth/me/

    Returns the currently authenticated user's profile.
    Uses Django's built-in auth.User (the one that created the JWT).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Fetch real roles from UserRole model via email
        roles = []
        try:
            from apps.users.models import User as AppUser
            from apps.roles.models import UserRole
            app_user = AppUser.objects.get(email=user.email)
            roles = list(
                UserRole.objects.filter(user=app_user)
                .select_related("role")
                .values_list("role__name", flat=True)
            )
        except Exception:
            if user.is_superuser:
                roles = ["ADMIN"]

        return Response(
            {
                "id": str(user.pk),
                "username": user.username,
                "email": user.email,
                "nombre": user.first_name or user.username,
                "apellido": user.last_name or "",
                "is_active": user.is_active,
                "created_at": user.date_joined.isoformat(),
                "roles": roles,
                "local_user_id": str(app_user.id) if 'app_user' in locals() else None,
            }
        )
