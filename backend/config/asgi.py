"""
ASGI config for the Biometric Access Control System.

Supports both HTTP (Django) and WebSocket (Channels) connections.
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.urls import re_path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize Django ASGI application early to ensure AppRegistry is populated
# before importing routing modules that depend on models.
django_asgi_app = get_asgi_application()

from apps.devices.consumers import DeviceConsumer

websocket_urlpatterns = [
    re_path(r"^ws/devices/(?P<device_id>[^/]+)/$", DeviceConsumer.as_asgi()),
]

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        ),
    }
)
