"""
apps/biometric/views.py

ViewSets:
  - BiometricViewSet: CRUD for biometric enrollment records
"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Biometric
from .serializers import BiometricSerializer

from apps.users.models import User
from .services.aws_s3 import upload_images_to_s3
from .services.aws_rekognition import index_user_faces_from_s3
from rest_framework.response import Response
from rest_framework import status


@extend_schema_view(
    list=extend_schema(
        tags=["Biometric"],
        summary="Listar registros biométricos",
        description=(
            "Retorna todos los registros de enrolamiento facial en la base de datos.\n\n"
            "**Filtros:** `user` (UUID), `is_active`"
        ),
        parameters=[
            OpenApiParameter("user", OpenApiTypes.UUID, description="UUID del usuario"),
            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Registros activos/inactivos"),
        ],
    ),
    create=extend_schema(
        tags=["Biometric"],
        summary="Crear registro biométrico",
        description=(
            "Registra un enrolamiento facial en el sistema. "
            "El ID de persona de Azure AI Face debe ser proporcionado."
        ),
    ),
    retrieve=extend_schema(tags=["Biometric"], summary="Obtener registro biométrico por ID"),
    update=extend_schema(tags=["Biometric"], summary="Actualizar registro biométrico"),
    partial_update=extend_schema(tags=["Biometric"], summary="Actualizar registro biométrico (parcial)"),
    destroy=extend_schema(tags=["Biometric"], summary="Eliminar registro biométrico"),
)
class BiometricViewSet(viewsets.ModelViewSet):
    """
    CRUD for biometric enrollment records.
    Actual Azure AI Face enrollment is handled at the service layer.
    """

    queryset = Biometric.objects.select_related("user").all().order_by("-is_active", "user__apellido")
    serializer_class = BiometricSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "is_active"]

    def create(self, request, *args, **kwargs):
        """
        Intercepts creation to upload images to Azure Blob Storage,
        and register the person in Azure AI Face.
        Expects multipart/form-data: `user` (UUID) and `images` (List of files).
        """
        user_id = request.data.get("user")
        images = request.FILES.getlist("images")

        if not user_id:
            return Response({"detail": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not images:
            return Response({"detail": "No images provided for biometric enrollment."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            # 1. Upload to AWS S3
            upload_results = upload_images_to_s3(str(user.id), images)
            if not upload_results:
                raise Exception("Failed to upload images to S3 storage.")

            # 2. Index faces in AWS Rekognition from S3
            face_id = "PENDING_AWS_REKOGNITION"
            warning = None
            
            try:
                s3_keys = [res['key'] for res in upload_results]
                aws_face_id = index_user_faces_from_s3(str(user.id), s3_keys)
                
                if aws_face_id:
                    face_id = aws_face_id
                else:
                    warning = "No se detectaron rostros en las imágenes subidas a S3."
            except Exception as face_error:
                warning = f"Imágenes subidas a S3, pero hubo un error en Rekognition: {str(face_error)}"
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(warning)

            # 3. Save Biometric record
            Biometric.objects.filter(user=user, is_active=True).update(is_active=False)

            biometric = Biometric.objects.create(
                user=user,
                face_id=face_id,
                storage_url=upload_results[0]['url'],
                is_active=True
            )

            serializer = self.get_serializer(biometric)
            response_data = serializer.data
            if warning:
                response_data["warning"] = warning
                
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
