import { useEffect, useState } from 'react';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useDeviceStatus(deviceId: string | null) {
  const [lastUpdate, setLastUpdate] = useState<{ lock_id: string; state: 'OPEN' | 'CLOSED' } | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    const wsUrl = `${WS_BASE_URL}/ws/devices/${deviceId}/`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'lock_status_update') {
          setLastUpdate({ lock_id: data.lock_id, state: data.state });
        }
      } catch (err) {
        console.error('Error parsing device WS message:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('Device WebSocket error:', err);
    };

    return () => {
      socket.close();
    };
  }, [deviceId]);

  return lastUpdate;
}
