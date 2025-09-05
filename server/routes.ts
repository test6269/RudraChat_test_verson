import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertMessageSchema } from "@shared/schema";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const { user, rno } = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      res.json({ success: true, user: { id: user.id, name: user.name, rno } });
    } catch (error) {
      res.status(400).json({ error: "Invalid input data" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { rno, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByRno(rno);
      if (!user) {
        return res.status(401).json({ error: "Invalid r_no or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid r_no or password" });
      }

      res.json({ success: true, user: { id: user.id, name: user.name, rno: user.rno } });
    } catch (error) {
      res.status(400).json({ error: "Invalid input data" });
    }
  });

  // Friend routes
  app.get("/api/friends/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const friends = await storage.getFriends(userId);
      res.json(friends.map(friend => ({ id: friend.id, name: friend.name, rno: friend.rno })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  app.post("/api/friends", async (req, res) => {
    try {
      const { userId, friendRno } = req.body;
      const success = await storage.addFriend(userId, friendRno);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Friend not found or already added" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to add friend" });
    }
  });

  // Message routes
  app.get("/api/messages/:userId/:friendId", async (req, res) => {
    try {
      const { userId, friendId } = req.params;
      const messages = await storage.getMessages(userId, friendId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // User profile routes
  app.put("/api/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { name } = req.body;
      const user = await storage.updateUserName(userId, name);
      
      if (user) {
        res.json({ success: true, user: { id: user.id, name: user.name, rno: user.rno } });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          ws.userId = message.userId;
        } else if (message.type === 'message') {
          // Validate and store message
          const messageData = insertMessageSchema.parse(message.data);
          const savedMessage = await storage.createMessage(messageData);
          
          // Broadcast message to all connected clients in the conversation
          wss.clients.forEach((client: AuthenticatedWebSocket) => {
            if (client.readyState === WebSocket.OPEN && 
                (client.userId === messageData.senderId || client.userId === messageData.receiverId)) {
              client.send(JSON.stringify({
                type: 'message',
                data: savedMessage
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return httpServer;
}
