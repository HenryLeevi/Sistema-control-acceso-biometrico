"""
ASGI config for the Biometric Access Control System.

Supports both HTTP (Django) and WebSocket (Channels) connections.
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize Django ASGI application early to ensure AppRegistry is populated
# before importing routing modules that depend on models.
django_asgi_app = get_asgi_application()

# WebSocket URL routing will be added here once Channels consumers are defined.
# Example:
# from apps.access import consumers
# websocket_urlpatterns = [
#     re_path(r"ws/access/(?P<aula_id>[^/]+)/$", consumers.AccessConsumer.as_asgi()),
# ]

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        # WebSocket handler — uncomment and configure consumers when ready:
        # "websocket": AllowedHostsOriginValidator(
        #     AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        # ),
    }
)
