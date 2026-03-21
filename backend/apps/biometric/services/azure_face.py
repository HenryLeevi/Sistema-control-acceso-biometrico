import time
import logging
from azure.cognitiveservices.vision.face import FaceClient
from msrest.authentication import CognitiveServicesCredentials
from django.conf import settings

logger = logging.getLogger(__name__)

def get_face_client() -> FaceClient:
    if not settings.AZURE_FACE_ENDPOINT or not settings.AZURE_FACE_SUBSCRIPTION_KEY:
        raise ValueError("Credenciales de Azure Face API no configuradas.")
    return FaceClient(
        settings.AZURE_FACE_ENDPOINT,
        CognitiveServicesCredentials(settings.AZURE_FACE_SUBSCRIPTION_KEY)
    )

def ensure_person_group(client: FaceClient, group_id: str):
    """Verifica que exista el PersonGroup indicado, si no lo crea."""
    try:
        client.person_group.get(group_id)
    except Exception as e:
        if "PersonGroupNotFound" in str(e):
            logger.info(f"Creando PersonGroup: {group_id}")
            # Se recomienda usar recognition_04 para mejores resultados en identificación
            client.person_group.create(group_id, name="Biometric Access Group", recognition_model="recognition_04")
        else:
            raise e

def create_person_and_add_faces(user_name: str, image_urls: list) -> str:
    """
    Crea una persona en el PersonGroup, añade los rostros desde las URLs,
    entrena el modelo y devuelve el person_id resultante.
    """
    if not image_urls:
        raise ValueError("No se proporcionaron imágenes para la API de Face.")

    client = get_face_client()
    group_id = getattr(settings, "AZURE_FACE_PERSON_GROUP_ID", "biometric-access-group")

    ensure_person_group(client, group_id)

    # Crear persona
    person = client.person_group_person.create(group_id, name=user_name)
    person_id = person.person_id

    # Agregar cada rostro usando las URLs públicas del blob storage
    for url in image_urls:
        try:
            # Utilizamos detection_03 que es más moderno
            client.person_group_person.add_face_from_url(group_id, person_id, url, detection_model="detection_03")
        except Exception as e:
            logger.warning(f"Error agregando rostro desde URL {url}: {e}")

    # Entrenar el grupo
    client.person_group.train(group_id)

    # Opcional: Esperar a que el entrenamiento termine (o dejarlo asíncrono)
    # Por lo general para control de acceso, se espera que el modelo actualice rápido.
    while True:
        training_status = client.person_group.get_training_status(group_id)
        if training_status.status in ['succeeded', 'failed']:
            if training_status.status == 'failed':
                logger.error("Error al entrenar el PersonGroup.")
            break
        time.sleep(1)

    return str(person_id)

def identify_face(image_stream) -> str:
    """
    Detecta rostros en un stream de imagen y devuelve el person_id del mejor coincidente,
    o None si no encuentra ninguno aceptable.
    """
    client = get_face_client()
    group_id = getattr(settings, "AZURE_FACE_PERSON_GROUP_ID", "biometric-access-group")

    if hasattr(image_stream, 'seek'):
        image_stream.seek(0)

    try:
        detected_faces = client.face.detect_with_stream(
            image_stream,
            recognition_model="recognition_04",
            detection_model="detection_03"
        )
    except Exception as e:
        logger.error(f"Error detectando rostro: {e}")
        return None

    if not detected_faces:
        return None

    face_ids = [face.face_id for face in detected_faces]

    try:
        results = client.face.identify(face_ids, group_id)
    except Exception as e:
        logger.error(f"Error identificando rostro: {e}")
        return None

    if not results:
        return None

    for result in results:
        if result.candidates:
            best_candidate = sorted(result.candidates, key=lambda c: c.confidence, reverse=True)[0]
            if best_candidate.confidence > 0.5:  # Threshold configurable
                return str(best_candidate.person_id)

    return None
