import { type User, type InsertUser, type Friend, type InsertFriend, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, friends, messages } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByRno(rno: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<{ user: User; rno: string }>;
  updateUserName(id: string, name: string): Promise<User | undefined>;

  // Friend methods
  getFriends(userId: string): Promise<User[]>;
  addFriend(userId: string, friendRno: string): Promise<boolean>;
  getFriendship(userId: string, friendId: string): Promise<Friend | undefined>;

  // Message methods
  getMessages(senderId: string, receiverId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private friends: Map<string, Friend>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.friends = new Map();
    this.messages = new Map();
  }

  private generateRno(): string {
    let rno: string;
    do {
      const randomNum = Math.floor(Math.random() * 10000000);
      rno = `RUD-${randomNum.toString().padStart(7, '0')}`;
    } while (Array.from(this.users.values()).some(user => user.rno === rno));
    return rno;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByRno(rno: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.rno === rno);
  }

  async createUser(insertUser: InsertUser): Promise<{ user: User; rno: string }> {
    const id = randomUUID();
    const rno = this.generateRno();
    const user: User = { 
      ...insertUser, 
      id, 
      rno,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return { user, rno };
  }

  async updateUserName(id: string, name: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, name };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async getFriends(userId: string): Promise<User[]> {
    const userFriends = Array.from(this.friends.values())
      .filter(friendship => 
        (friendship.userId === userId || friendship.friendId === userId) && 
        friendship.status === 'accepted'
      );
    
    const friendIds = userFriends.map(friendship => 
      friendship.userId === userId ? friendship.friendId : friendship.userId
    );

    return friendIds
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }

  async addFriend(userId: string, friendRno: string): Promise<boolean> {
    const friend = await this.getUserByRno(friendRno);
    if (!friend || friend.id === userId) {
      return false;
    }

    // Check if friendship already exists
    const existingFriendship = await this.getFriendship(userId, friend.id);
    if (existingFriendship) {
      return false;
    }

    const friendshipId = randomUUID();
    const friendship: Friend = {
      id: friendshipId,
      userId,
      friendId: friend.id,
      status: 'accepted', // Auto-accept for simplicity
      createdAt: new Date()
    };

    this.friends.set(friendshipId, friendship);
    return true;
  }

  async getFriendship(userId: string, friendId: string): Promise<Friend | undefined> {
    return Array.from(this.friends.values()).find(friendship =>
      (friendship.userId === userId && friendship.friendId === friendId) ||
      (friendship.userId === friendId && friendship.friendId === userId)
    );
  }

  async getMessages(senderId: string, receiverId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message =>
        (message.senderId === senderId && message.receiverId === receiverId) ||
        (message.senderId === receiverId && message.receiverId === senderId)
      )
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date()
    };
    this.messages.set(id, message);
    return message;
  }
}

export class PostgreSQLStorage implements IStorage {
  private generateRno(): string {
    const randomNum = Math.floor(Math.random() * 10000000);
    return `RUD-${randomNum.toString().padStart(7, '0')}`;
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByRno(rno: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.rno, rno)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by rno:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<{ user: User; rno: string }> {
    try {
      let rno: string;
      let isUnique = false;
      
      // Generate unique r_no
      do {
        rno = this.generateRno();
        const existing = await this.getUserByRno(rno);
        isUnique = !existing;
      } while (!isUnique);

      const result = await db.insert(users).values({
        ...insertUser,
        rno
      }).returning();
      
      return { user: result[0], rno };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserName(id: string, name: string): Promise<User | undefined> {
    try {
      const result = await db.update(users).set({ name }).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user name:', error);
      return undefined;
    }
  }

  async getFriends(userId: string): Promise<User[]> {
    try {
      const friendships = await db.select().from(friends).where(
        and(
          or(eq(friends.userId, userId), eq(friends.friendId, userId)),
          eq(friends.status, 'accepted')
        )
      );

      const friendIds = friendships.map(friendship => 
        friendship.userId === userId ? friendship.friendId : friendship.userId
      );

      if (friendIds.length === 0) return [];

      const friendUsers = await db.select().from(users).where(
        or(...friendIds.map(id => eq(users.id, id)))
      );

      return friendUsers;
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  }

  async addFriend(userId: string, friendRno: string): Promise<boolean> {
    try {
      const friend = await this.getUserByRno(friendRno);
      if (!friend || friend.id === userId) {
        return false;
      }

      // Check if friendship already exists
      const existingFriendship = await this.getFriendship(userId, friend.id);
      if (existingFriendship) {
        return false;
      }

      await db.insert(friends).values({
        userId,
        friendId: friend.id,
        status: 'accepted'
      });

      return true;
    } catch (error) {
      console.error('Error adding friend:', error);
      return false;
    }
  }

  async getFriendship(userId: string, friendId: string): Promise<Friend | undefined> {
    try {
      const result = await db.select().from(friends).where(
        or(
          and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, userId))
        )
      ).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting friendship:', error);
      return undefined;
    }
  }

  async getMessages(senderId: string, receiverId: string): Promise<Message[]> {
    try {
      const result = await db.select().from(messages).where(
        or(
          and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
          and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
        )
      ).orderBy(messages.timestamp);
      return result;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      const result = await db.insert(messages).values(insertMessage).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }
}

export const storage = new PostgreSQLStorage();
