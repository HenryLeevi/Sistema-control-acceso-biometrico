import boto3
from django.conf import settings
import uuid
import os

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION_NAME
    )

def upload_images_to_s3(user_id, image_files):
    """
    Uploads multiple images to AWS S3.
    Returns a list of dicts: [{'url': '...', 'key': '...'}]
    """
    s3_client = get_s3_client()
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    results = []

    for image in image_files:
        ext = os.path.splitext(image.name)[1] or '.jpg'
        filename = f"users/{user_id}/{uuid.uuid4()}{ext}"
        
        image.seek(0)
        s3_client.upload_fileobj(
            image,
            bucket_name,
            filename,
            ExtraArgs={'ContentType': image.content_type}
        )
        
        url = f"https://{bucket_name}.s3.{settings.AWS_REGION_NAME}.amazonaws.com/{filename}"
        results.append({
            'url': url,
            'key': filename
        })
        
    return results

def delete_image_from_s3(key):
    """
    Deletes an object from S3 given its key.
    """
    s3_client = get_s3_client()
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=key)
        print(f"DEBUG S3: Successfully deleted key {key}")
        return True
    except Exception as e:
        print(f"DEBUG S3 Error: Failed to delete key {key}: {e}")
        return False
