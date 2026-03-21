import os
import uuid
import logging
from typing import List
from azure.storage.blob import BlobServiceClient
from django.conf import settings
from azure.core.exceptions import ResourceExistsError

logger = logging.getLogger(__name__)

def get_blob_service_client() -> BlobServiceClient:
    if not settings.AZURE_STORAGE_CONNECTION_STRING:
        raise ValueError("AZURE_STORAGE_CONNECTION_STRING no está configurado.")
    return BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)


def upload_images(user_id: str, image_files: list) -> List[str]:
    """
    Sube una lista de imágenes a Azure Blob Storage.
    Devuelve la lista de URLs de los blobs creados.
    """
    if not image_files:
        return []

    client = get_blob_service_client()
    container_name = getattr(settings, "AZURE_STORAGE_CONTAINER_NAME", "biometric-images")
    container_client = client.get_container_client(container_name)

    # Intentar crear el contenedor si no existe
    try:
        container_client.create_container()
    except ResourceExistsError:
        pass
    except Exception as e:
        logger.warning(f"Error al verificar/crear contenedor de Storage: {e}")

    urls = []
    for image in image_files:
        # Generar nombre único: {user_id}/{uuid}.{ext}
        ext = "jpg"
        if hasattr(image, 'name') and '.' in image.name:
            ext = image.name.split('.')[-1].lower()

        blob_name = f"{user_id}/{uuid.uuid4()}.{ext}"
        blob_client = container_client.get_blob_client(blob_name)

        if hasattr(image, 'seek'):
            image.seek(0)
            
        # Determinar el content type básico
        content_type = f"image/{ext}" if ext in ["jpg", "jpeg", "png"] else "application/octet-stream"
        
        # Subir imagen
        blob_client.upload_blob(image, overwrite=True)
        urls.append(blob_client.url)

    return urls
