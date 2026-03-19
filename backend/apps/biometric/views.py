"""
apps/biometric/views.py

ViewSets:
  - BiometricViewSet: CRUD for biometric enrollment records
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Biometric
from .serializers import BiometricSerializer


class BiometricViewSet(viewsets.ModelViewSet):
    """
    CRUD for biometric enrollment records.

    NOTE: Actual Azure AI Face enrollment is performed at the service layer.
    This ViewSet manages the database records only.
    """

    queryset = Biometric.objects.select_related("user").all()
    serializer_class = BiometricSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "is_active"]
