import { useEffect, useRef } from "react";
import type { Message, InsertMessage } from "@shared/schema";

interface UseSocketReturn {
  sendMessage: (message: InsertMessage) => void;
}

export function useSocket(
  userId: string | undefined,
  onMessage: (message: Message) => void
): UseSocketReturn {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
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
          onMessage(data.data);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [userId, onMessage]);

  const sendMessage = (message: InsertMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'message',
        data: message
      }));
    }
  };

  return { sendMessage };
}
