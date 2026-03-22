import os
import boto3
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend dir
base_dir = Path(__file__).resolve().parent / "backend"
load_dotenv(base_dir / ".env")

def test_manual_index():
    print("--- Manual Indexing Test ---")
    bucket = os.getenv("AWS_STORAGE_BUCKET_NAME")
    collection_id = os.getenv("AWS_REKOGNITION_COLLECTION_ID")
    image_key = 'media/biometrics/76bceb06-78f0-40df-a6f3-876c867a5f6c/2efbee05-3aaa-42d2-89a1-213b1bb70300.jpg'
    user_id = '76bceb06-78f0-40df-a6f3-876c867a5f6c' # User 'biometrico'

    rek = boto3.client(
        'rekognition',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION_NAME")
    )

    try:
        print(f"Indexing image: s3://{bucket}/{image_key}")
        response = rek.index_faces(
            CollectionId=collection_id,
            Image={'S3Object': {'Bucket': bucket, 'Name': image_key}},
            ExternalImageId=user_id,
            MaxFaces=1,
            QualityFilter="AUTO"
        )
        
        print("\n--- Rekognition Response ---")
        if response['FaceRecords']:
            print(f"SUCCESS: Face indexed! FaceId: {response['FaceRecords'][0]['Face']['FaceId']}")
        else:
            print("FAILURE: No faces indexed.")
            unindexed = response.get('UnindexedFaces', [])
            if unindexed:
                print(f"Unindexed reasons: {unindexed[0].get('Reasons', [])}")
            else:
                print("AWS detected no face at all in this image.")
                
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    test_manual_index()
