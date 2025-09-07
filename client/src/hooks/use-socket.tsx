import { useEffect, useRef, useCallback, useState } from "react";
import type { Message, InsertMessage } from "@shared/schema";

interface UseSocketReturn {
  sendMessage: (message: InsertMessage) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

export function useSocket(
  userId: string | undefined,
  onMessage: (message: Message) => void,
  onFriendAdded?: () => void
): UseSocketReturn {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const messageHandlerRef = useRef(onMessage);
  messageHandlerRef.current = onMessage;

  const connectWebSocket = useCallback(() => {
    if (!userId) return;

    setConnectionStatus('connecting');
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      reconnectAttemptRef.current = 0;
      
      // Authenticate with user ID
      socket.send(JSON.stringify({
        type: 'auth',
        userId
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          console.log('Received message:', data.data);
          messageHandlerRef.current(data.data);
        } else if (data.type === 'friend_added') {
          console.log('New friend added:', data.data);
          if (onFriendAdded) {
            onFriendAdded();
          }
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
      setConnectionStatus('disconnected');
      
      // Only attempt to reconnect if the closure wasn't intentional
      if (event.code !== 1000 && userId) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptRef.current++;
          connectWebSocket();
        }, delay);
      }
    };
  }, [userId]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback((message: InsertMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'message',
        data: message
      }));
      console.log('Message sent:', message);
    } else {
      console.error('WebSocket not connected, message not sent. Status:', connectionStatus);
      // Try to reconnect if we're disconnected
      if (connectionStatus === 'disconnected') {
        connectWebSocket();
      }
    }
  }, [connectionStatus, connectWebSocket]);

  return { sendMessage, connectionStatus };
}
