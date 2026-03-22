import os
import boto3
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend dir
base_dir = Path(__file__).resolve().parent / "backend"
load_dotenv(base_dir / ".env")

def list_faces():
    print("--- Listing Faces in Rekognition Collection ---")
    collection_id = os.getenv("AWS_REKOGNITION_COLLECTION_ID")
    if not collection_id:
        print("Error: AWS_REKOGNITION_COLLECTION_ID missing in .env")
        return

    try:
        rek = boto3.client(
            'rekognition',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION_NAME")
        )
        
        response = rek.list_faces(CollectionId=collection_id)
        faces = response.get('Faces', [])
        
        if not faces:
            print(f"No faces found in collection {collection_id}.")
        else:
            print(f"Found {len(faces)} faces:")
            for face in faces:
                face_id = face['FaceId']
                external_id = face.get('ExternalImageId', 'NONE')
                confidence = face.get('Confidence', 'N/A')
                print(f"- FaceId: {face_id} | ExternalImageId (User UUID): {external_id} | Confidence: {confidence}")
                
    except Exception as e:
        print(f"Rekognition Error: {e}")

if __name__ == "__main__":
    list_faces()
