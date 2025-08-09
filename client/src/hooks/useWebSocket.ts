import { useEffect, useRef, useState, useCallback } from 'react';
import { type BoardUpdate } from '@shared/schema';

export function useWebSocket(onMessage?: (data: BoardUpdate) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (ws.current && ws.current.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection already in progress');
      return;
    }
    
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
        
        // Only auto-reconnect for unexpected closures and if we haven't exceeded max attempts
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts < maxReconnectAttempts) {
          const newAttempts = reconnectAttempts + 1;
          setTimeout(() => {
            console.log(`Reconnecting WebSocket (attempt ${newAttempts})`);
            setReconnectAttempts(newAttempts);
            connect();
          }, reconnectDelay * Math.pow(2, reconnectAttempts));
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached, giving up');
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
  }, [reconnectAttempts]);

  useEffect(() => {
    // Temporarily disable WebSocket to prevent connection loops
    // connect();

    // For now, just set as disconnected
    setIsConnected(false);

    return () => {
      if (ws.current) {
        ws.current.close(1000, 'Component unmounted');
        ws.current = null;
      }
    };
  }, [onMessage]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  };

  return { isConnected, sendMessage };
}
