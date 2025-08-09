import { useEffect, useRef, useState, useCallback } from 'react';
import { type BoardUpdate } from '@shared/schema';

export function useWebSocket(onMessage?: (data: BoardUpdate) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setReconnectAttempts(0);
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Auto-reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            console.log(`Reconnecting WebSocket (attempt ${reconnectAttempts + 1})`);
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectDelay * Math.pow(2, reconnectAttempts)); // Exponential backoff
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data: BoardUpdate = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [onMessage, reconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close(1000, 'Component unmounted');
        ws.current = null;
      }
    };
  }, [connect]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  };

  return { isConnected, sendMessage };
}
