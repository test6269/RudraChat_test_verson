import { useEffect, useRef, useCallback } from "react";
import type { Message, InsertMessage } from "@shared/schema";

interface UseSocketReturn {
  sendMessage: (message: InsertMessage) => void;
}

export function useSocket(
  userId: string | undefined,
  onMessage: (message: Message) => void
): UseSocketReturn {
  const socketRef = useRef<WebSocket | null>(null);

  const messageHandlerRef = useRef(onMessage);
  messageHandlerRef.current = onMessage;

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
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
          messageHandlerRef.current(data.data);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      socket.close();
    };
  }, [userId]);

  const sendMessage = useCallback((message: InsertMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'message',
        data: message
      }));
      console.log('Message sent:', message);
    } else {
      console.error('WebSocket not connected, message not sent');
    }
  }, []);

  return { sendMessage };
}
