"""
asgi.py — Configuración para Django Channels.
Maneja conexiones HTTP normales y WebSockets.
"""

import os
from django.core.asgi import get_asgi_application

# Configurar el módulo de settings antes de inicializar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Inicializar la aplicación ASGI de Django PRIMERO
django_asgi_app = get_asgi_application()

# Importaciones de Channels (después de inicializar Django)
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path, re_path
from apps.devices.consumers import DeviceConsumer

# Definición de rutas de WebSocket
websocket_urlpatterns = [
    # Permitir barra diagonal opcional para mayor compatibilidad
    re_path(r"^ws/devices/(?P<device_id>[^/]+)/?$", DeviceConsumer.as_asgi()),
]

# Configuración del stack de WebSocket
# En producción, Daphne/Channels puede rechazar conexiones sin encabezado 'Origin' (como las de IoT).
# Para este sistema de acceso, permitimos conexiones basadas en ID de dispositivo y AuthMiddleware.
websocket_stack = AuthMiddlewareStack(URLRouter(websocket_urlpatterns))

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": websocket_stack,
    }
)
