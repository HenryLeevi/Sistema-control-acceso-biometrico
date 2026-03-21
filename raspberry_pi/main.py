import os
import json
import asyncio
import websockets
from dotenv import load_dotenv

# Configuración
load_dotenv()
API_TOKEN = os.getenv("RPI_API_TOKEN", "super-secret-token-123")
AULA_ID = os.getenv("AULA_ID", "1") # ID del aula a la que pertenece este dispositivo
# URL del WebSocket en Azure. Ej: wss://tu-app.azurewebsites.net/ws/access/1/
WS_URL = os.getenv("WS_URL", f"ws://localhost:8000/ws/access/{AULA_ID}/") 
SERVO_PIN = int(os.getenv("SERVO_PIN", 18))
PUERTA_ABIERTA_SEGUNDOS = int(os.getenv("PUERTAS_ABIERTA_SEGUNDOS", 5))

# Intentar importar librería de hardware
try:
    from gpiozero import AngularServo
    from gpiozero.pins.pigpio import PiGPIOFactory
    factory = PiGPIOFactory()
    servo = AngularServo(
        SERVO_PIN, 
        min_angle=-90, 
        max_angle=90, 
        min_pulse_width=0.0005, 
        max_pulse_width=0.0024,
        pin_factory=factory
    )
    print("✅ Hardware conectado exitosamente.")
    servo.angle = -90 # Estado inicial cerrado
except (ImportError, Exception) as e:
    print(f"⚠️  Hardware no detectado: {e}")
    print("Iniciando en modo MOCK (Simulación)")
    class MockServo:
        def __init__(self):
            self.angle = -90
    servo = MockServo()


async def open_door_sequence():
    """Ejecuta la rotación física del servo de forma asíncrona"""
    try:
        print("🚪 Abriendo puerta...")
        servo.angle = 90
        await asyncio.sleep(PUERTA_ABIERTA_SEGUNDOS)
        print("🚪 Cerrando puerta...")
        servo.angle = -90
        
        if hasattr(servo, 'value'):
            servo.value = None # Apagar PWM temporalmente para evitar jitter
    except Exception as e:
        print(f"Error controlando el servo: {e}")


async def listen_to_django():
    """Conecta al WebSocket de Azure y escucha comandos"""
    headers = {"Authorization": f"Bearer {API_TOKEN}"}
    
    print(f"🔄 Conectando a {WS_URL}...")
    
    try:
        # Reconexión infinita si se cae el internet
        async for websocket in websockets.connect(WS_URL, extra_headers=headers):
            print("✅ Conectado exitosamente al servidor MQTT/WebSocket de Azure")
            try:
                async for message in websocket:
                    data = json.loads(message)
                    print(f"📩 Mensaje recibido: {data}")
                    
                    if data.get("action") == "OPEN":
                        # Inicia la secuencia sin bloquear el hilo del websocket
                        asyncio.create_task(open_door_sequence())
                        
                        # Responder al server que recibimos la orden
                        await websocket.send(json.dumps({
                            "status": "success",
                            "message": "Abriendo puerta..."
                        }))
                        
            except websockets.ConnectionClosed:
                print("❌ Conexión perdida. Intentando reconectar en 3 segundos...")
                await asyncio.sleep(3)
                continue
    except Exception as e:
        print(f"Error crítico en WebSocket: {e}")
        await asyncio.sleep(5)
        # Volver a intentar (opcionalmente podrías llamar a esta función recursivamente o en un loop while True)

if __name__ == "__main__":
    # Loop infinito principal
    while True:
        try:
            asyncio.run(listen_to_django())
        except KeyboardInterrupt:
            print("Apagando cliente...")
            break
        except Exception:
            pass
