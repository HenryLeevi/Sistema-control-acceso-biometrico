"""
WSGI config for the Biometric Access Control System.

Used by gunicorn/uWSGI for synchronous HTTP serving.
For async/WebSocket support use the ASGI application (config/asgi.py).
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()
