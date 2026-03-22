"""
apps/devices/consumers.py

WebSocket consumers for real-time device communication.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

logger = logging.getLogger(__name__)

class DeviceConsumer(AsyncWebsocketConsumer):
    """
    Consumer for Raspberry Pi edge devices.
    Connects to ws/devices/<device_id>/.
    """

    async def connect(self):
        self.device_id = self.scope["url_route"]["kwargs"]["device_id"]
        self.group_name = f"device_{self.device_id}"

        # Join room group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Update device status to ONLINE
        await self.update_device_status("ONLINE")
        logger.info(f"Device {self.device_id} connected.")

    async def disconnect(self, close_code):
        # Update device status to OFFLINE
        await self.update_device_status("OFFLINE")
        
        # Leave room group
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"Device {self.device_id} disconnected.")

    async def receive(self, text_data):
        """
        Handle messages from the device (e.g. status updates).
        """
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            
            if message_type == "status_update":
                await self.handle_status_update(data)
            elif message_type == "heartbeat":
                await self.update_device_last_seen()
        except Exception as e:
            logger.error(f"Error processing device message: {e}")

    async def handle_status_update(self, data):
        """
        Handle lock state updates from the device and broadcast to the group.
        """
        lock_id = data.get("lock_id")
        state = data.get("state")
        
        if lock_id and state:
            await self.sync_lock_state(lock_id, state)
            # Broadcast to everyone in the group (e.g. frontend)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "lock_status_broadcast",
                    "lock_id": lock_id,
                    "state": state
                }
            )

    async def lock_status_broadcast(self, event):
        """
        Send status broadcast to the WebSocket.
        """
        await self.send(text_data=json.dumps({
            "type": "lock_status_update",
            "lock_id": event["lock_id"],
            "state": event["state"]
        }))

    # ─────────────────────────────────────────
    # Group Messages (Commands to Device)
    # ─────────────────────────────────────────

    async def device_command(self, event):
        """
        Send a command to the device (e.g. OPEN_DOOR).
        """
        await self.send(text_data=json.dumps(event["payload"]))

    # ─────────────────────────────────────────
    # Database Operations
    # ─────────────────────────────────────────

    @database_sync_to_async
    def update_device_status(self, status):
        from .models import Device
        Device.objects.filter(id=self.device_id).update(
            status=status, 
            last_seen=timezone.now()
        )

    @database_sync_to_async
    def update_device_last_seen(self):
        from .models import Device
        Device.objects.filter(id=self.device_id).update(last_seen=timezone.now())

    @database_sync_to_async
    def sync_lock_state(self, lock_id, state):
        from .models import Lock
        from apps.access.models import Aula
        
        lock = Lock.objects.filter(id=lock_id).first()
        if lock:
            # Update Aula actual_state based on device report
            aula = lock.aula
            aula.actual_state = state
            aula.save()
            logger.info(f"Lock {lock_id} state synced to {state} for Aula {aula.code}")
