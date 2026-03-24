#!/bin/bash
# startup.sh — Script para forzar el uso de Daphne en Azure App Service.
# Esto asegura que los WebSockets (/ws/) funcionen correctamente.

# 1. Instalar dependencias si es necesario (Oryx ya lo hace, pero por seguridad)
# pip install -r requirements.txt

# 2. Iniciar Daphne en el puerto 8000
echo "CONTENIDO DE WWWROOT:"
ls -R /home/site/wwwroot/

echo "Iniciando Daphne en el puerto 8000 (ASGI)..."
# Usamos el path completo para evitar ambigüedades
/tmp/8de*/antenv/bin/daphne -b 0.0.0.0 -p 8000 config.asgi:application || daphne -b 0.0.0.0 -p 8000 config.asgi:application
