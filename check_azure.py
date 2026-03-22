import os
import socket
import requests
from urllib.parse import urlparse
from azure.storage.blob import BlobServiceClient
from azure.cognitiveservices.vision.face import FaceClient
from msrest.authentication import CognitiveServicesCredentials
from dotenv import load_dotenv
from pathlib import Path

# Load env
base_dir = Path(r"c:\Users\Laptop_hp\Desktop\Sistema-control-acceso-biometrico\backend")
load_dotenv(base_dir / ".env")

def check_dns(url):
    print(f"--- Checking DNS and Environment for {url} ---")
    try:
        domain = urlparse(url).netloc
        print(f"Resolving {domain}...")
        ip = socket.gethostbyname(domain)
        print(f"Success! IP: {ip}")
    except Exception as e:
        print(f"Connectivity Error: {e}")

def check_storage():
    print("--- Checking Azure Blob Storage ---")
    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn_str:
        print("Error: AZURE_STORAGE_CONNECTION_STRING is missing in .env")
        return
    try:
        client = BlobServiceClient.from_connection_string(conn_str)
        containers = list(client.list_containers())
        print(f"Success! Found {len(containers)} containers.")
    except Exception as e:
        print(f"Error accessing Storage: {e}")

def check_face_raw():
    print("\n--- Checking Azure Face API (Raw HTTP) ---")
    endpoint = os.getenv("AZURE_FACE_ENDPOINT", "").strip()
    key = os.getenv("AZURE_FACE_SUBSCRIPTION_KEY", "").strip()
    
    if not endpoint or not key:
        print("Error: Face endpoint or key missing in .env")
        return
        
    if endpoint.endswith('/'): endpoint = endpoint[:-1]
    url = f"{endpoint}/face/v1.0/persongroups"
    headers = {"Ocp-Apim-Subscription-Key": key}
    
    try:
        print(f"GET {url}...")
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"HTTP Error: {e}")

if __name__ == "__main__":
    endpoint = os.getenv("AZURE_FACE_ENDPOINT", "").strip()
    if endpoint: check_dns(endpoint)
    check_storage()
    check_face_raw()
