# Raspberry Pi Servo Controller (WebSocket Edge Node)

Este microservicio se ejecuta en la **Raspberry Pi** para controlar el servomotor. Al usar **WebSockets**, la Raspberry Pi actúa como *Cliente* y el Backend de Django en Azure actúa como *Servidor*.

### ¿Por qué WebSockets en lugar de una API REST?
1. **Atraviesa Firewalls:** Tu Raspberry se puede conectar a cualquier red Wi-Fi (universidad, casa, empresa) y funcionará instantáneamente. No necesitas abrir puertos en el router ni usar `Ngrok`.
2. **Tiempo Real:** La conexión con Azure se mantiene siempre abierta. Cuando alguien es autorizado en Azure, el mensaje baja a la Raspberry en milisegundos.
3. **Reconexión Automática:** Si se cae el internet local, el script de Python detecta la pérdida de señal y se reconecta a Azure en cuanto vuelve la conexión.

---

## 🏗️ Requisitos en la Raspberry Pi

### 1. Sistema Operativo
Asegúrate de tener **Raspberry Pi OS** instalado y Python 3.9 o superior.

### 2. Habilitar pigpiod (Crítico para que el motor no tiemble)
La librería `pigpio` provee hardware PWM en lugar de software PWM, haciendo que el servo sea exacto.

Activa el demonio (daemon) en la Raspberry ejecutando esto en tu terminal:
```bash
sudo apt update
sudo apt install pigpio python3-pigpio
sudo systemctl enable pigpiod
sudo systemctl start pigpiod
```

### 3. Conexiones Físicas del Servo (Ej. SG90 / MG996R)
El servomotor típico tiene 3 cables:
- 🔴 **Rojo:** Energía (5V — Pin 2 o 4 físico)
- 🟤 **Marrón/Negro:** Tierra (GND — Pin 6 físico)
- 🟡 **Amarillo/Naranja:** Señal PWM (Conéctalo al GPIO 18 — Pin 12 físico)

---

## 🚀 Instalación y Ejecución

Entra por SSH a tu Raspberry y sigue estos pasos:

### 1. Preparar la carpeta
```bash
cd raspberry_pi
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configurar variables de entorno (`.env`)
En el archivo `main.py` o creando un archivo `.env` en esta misma carpeta, debes poner las credenciales reales de tu aplicación en Azure:

```env
# Ejemplo de .env
RPI_API_TOKEN=super-secret-token-123
AULA_ID=1
# IMPORTANTE: Cambia "localhost:8000" por el dominio de tu Azure App con "wss://"
WS_URL=ws://localhost:8000/ws/access/1/
SERVO_PIN=18
PUERTAS_ABIERTA_SEGUNDOS=5
```

### 3. Ejecutar el Cliente
```bash
python main.py
```

Vas a ver en la terminal algo como:
`✅ Conectado exitosamente al servidor MQTT/WebSocket de Azure`

*(Si lo corres desde Windows/Mac, automáticamente entrará en modo MOCK y se conectará al Django local para que puedas probar la comunicación sin quemar hardware).*
