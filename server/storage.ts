import { type User, type InsertUser, type Friend, type InsertFriend, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
