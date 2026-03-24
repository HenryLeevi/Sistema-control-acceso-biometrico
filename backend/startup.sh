#!/bin/bash
# startup.sh — Script para forzar el uso de Daphne en Azure App Service.
# Esto asegura que los WebSockets (/ws/) funcionen correctamente.

# 1. Instalar dependencias si es necesario (Oryx ya lo hace, pero por seguridad)
# pip install -r requirements.txt

# 2. Iniciar Daphne en el puerto 8000 (puerto interno por defecto de Azure Linux)
echo "Iniciando Daphne en el puerto 8000..."
daphne -b 0.0.0.0 -p 8000 config.asgi:application
