import boto3
from django.conf import settings
from botocore.exceptions import ClientError

def get_rekognition_client():
    return boto3.client(
        'rekognition',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION_NAME
    )

def ensure_collection_exists():
    client = get_rekognition_client()
    collection_id = settings.AWS_REKOGNITION_COLLECTION_ID
    try:
        client.describe_collection(CollectionId=collection_id)
        print(f"Collection {collection_id} already exists.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Creating collection {collection_id}...")
            client.create_collection(CollectionId=collection_id)
        else:
            raise e

def index_user_faces_from_s3(user_id, s3_keys):
    """
    Indexes multiple images for a user into the Rekognition collection
    using images already stored in S3.
    Returns the FaceId of the last indexed face.
    """
    client = get_rekognition_client()
    collection_id = settings.AWS_REKOGNITION_COLLECTION_ID
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    
    # Ensure collection exists
    ensure_collection_exists()
    
    last_face_id = None
    
    for i, key in enumerate(s3_keys):
        print(f"DEBUG REKOGNITION: Indexing face {i+1}/{len(s3_keys)} from S3 for user {user_id}")
        response = client.index_faces(
            CollectionId=collection_id,
            Image={'S3Object': {'Bucket': bucket_name, 'Name': key}},
            ExternalImageId=str(user_id),
            MaxFaces=1,
            QualityFilter="AUTO"
        )
        
        if response['FaceRecords']:
            face = response['FaceRecords'][0]['Face']
            last_face_id = face['FaceId']
            print(f"DEBUG REKOGNITION: Successfully indexed face {i+1}. FaceId: {last_face_id}")
        else:
            print(f"DEBUG REKOGNITION: No face detected or indexed in S3 image {i+1} ({key}).")
            unindexed = response.get('UnindexedFaces', [])
            if unindexed:
                reasons = unindexed[0].get('Reasons', [])
                print(f"DEBUG REKOGNITION: Unindexed reasons: {reasons}")
            
    return last_face_id

def search_face_by_image(image_bytes):
    """
    Searches for a face in the collection using an input image.
    Returns the user_id (ExternalImageId) if a match is found.
    """
    client = get_rekognition_client()
    collection_id = settings.AWS_REKOGNITION_COLLECTION_ID
    
    try:
        response = client.search_faces_by_image(
            CollectionId=collection_id,
            Image={'Bytes': image_bytes},
            MaxFaces=1,
            FaceMatchThreshold=70  # Lowered from 80 for better recall
        )
        
        if response['FaceMatches']:
            match = response['FaceMatches'][0]
            print(f"DEBUG REKOGNITION: Match found! ID={match['Face']['ExternalImageId']}, Confidence={match['Similarity']}%")
            return match['Face']['ExternalImageId']
        else:
            print("DEBUG REKOGNITION: No face matches found in collection.")
            
    except ClientError as e:
        print(f"Rekognition Search Error: {e}")
        
    return None

def delete_face_from_collection(face_id):
    """
    Deletes a face from the Rekognition collection given its FaceId.
    """
    if not face_id or face_id == "PENDING_AWS_REKOGNITION":
        return
        
    client = get_rekognition_client()
    collection_id = settings.AWS_REKOGNITION_COLLECTION_ID
    try:
        client.delete_faces(
            CollectionId=collection_id,
            FaceIds=[face_id]
        )
        print(f"DEBUG REKOGNITION: Successfully deleted FaceId {face_id}")
        return True
    except Exception as e:
        print(f"DEBUG REKOGNITION Error: Failed to delete FaceId {face_id}: {e}")
        return False
