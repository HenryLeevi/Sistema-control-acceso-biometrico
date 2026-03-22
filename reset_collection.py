import os
import boto3
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend dir
base_dir = Path(__file__).resolve().parent / "backend"
load_dotenv(base_dir / ".env")

def reset_collection():
    print("--- Resetting Rekognition Collection ---")
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
        
        # Check if collection exists
        try:
            rek.describe_collection(CollectionId=collection_id)
            print(f"Collection {collection_id} found. Deleting...")
            rek.delete_collection(CollectionId=collection_id)
            print("Collection deleted.")
        except Exception:
            print(f"Collection {collection_id} did not exist.")

        # Re-create collection
        print(f"Creating collection {collection_id}...")
        rek.create_collection(CollectionId=collection_id)
        print("Collection reset successfully.")
                
    except Exception as e:
        print(f"Rekognition Error: {e}")

if __name__ == "__main__":
    reset_collection()
