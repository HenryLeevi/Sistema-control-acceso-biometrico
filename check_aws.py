import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend dir
base_dir = Path(__file__).resolve().parent / "backend"
load_dotenv(base_dir / ".env")

def check_s3():
    print("--- Checking AWS S3 ---")
    bucket_name = os.getenv("AWS_STORAGE_BUCKET_NAME")
    if not bucket_name:
        print("Error: AWS_STORAGE_BUCKET_NAME missing in .env")
        return

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION_NAME")
        )
        print(f"Testing UPLOAD to bucket: {bucket_name}")
        try:
            # Try to upload a small test file
            s3.put_object(
                Bucket=bucket_name,
                Key='test_connection.txt',
                Body='AWS Connection Test'
            )
            print(f"Success! Test file uploaded to {bucket_name}.")
            
            # Try to delete it to clean up
            s3.delete_object(Bucket=bucket_name, Key='test_connection.txt')
            print("Cleanup: Test file deleted.")
            
        except ClientError as e:
            print(f"S3 Upload Error: {e}")
            print("\nTip: Check if the bucket name is correct and if the region matches.")
    except Exception as e:
        print(f"S3 Client Error: {e}")

def check_rekognition():
    print("\n--- Checking AWS Rekognition ---")
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
        print(f"Checking collection: {collection_id}")
        try:
            rek.describe_collection(CollectionId=collection_id)
            print(f"Success! Collection {collection_id} exists.")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"Collection {collection_id} not found. Attempting to create...")
                rek.create_collection(CollectionId=collection_id)
                print(f"Success! Collection {collection_id} created.")
            else:
                raise e
    except Exception as e:
        print(f"Rekognition Error: {e}")

if __name__ == "__main__":
    check_s3()
    check_rekognition()
