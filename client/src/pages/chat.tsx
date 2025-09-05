import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import FriendsList from "@/components/chat/FriendsList";
import MessageBubble from "@/components/chat/MessageBubble";
import ProfileModal from "@/components/modals/ProfileModal";
import AddFriendModal from "@/components/modals/AddFriendModal";
import { useSocket } from "@/hooks/use-socket";
import type { User as UserType, Message } from "@shared/schema";

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserType | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<UserType | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const { sendMessage } = useSocket(user?.id, (message: Message) => {
    setMessages(prev => [...prev, message]);
  });

  // Check authentication
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [setLocation]);

  // Fetch friends
  const { data: friends = [], refetch: refetchFriends } = useQuery({
    queryKey: ["/api/friends", user?.id],
    enabled: !!user?.id,
  });

  // Fetch messages when friend is selected
  const { data: chatMessages = [] } = useQuery({
    queryKey: ["/api/messages", user?.id, selectedFriend?.id],
    enabled: !!user?.id && !!selectedFriend?.id,
  });

  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);

  const handleFriendSelect = (friend: UserType) => {
    setSelectedFriend(friend);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !user) return;

    sendMessage({
      senderId: user.id,
      receiverId: selectedFriend.id,
      text: newMessage.trim(),
    });

    setNewMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/login");
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <MessageCircle className="text-primary-foreground" size={24} />
          </div>
          <h1 className="text-xl font-semibold text-card-foreground">Rudra Chat</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAddFriendModal(true)}
            data-testid="button-add-friend"
          >
            <UserPlus className="text-card-foreground" size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowProfileModal(true)}
            data-testid="button-profile"
          >
            <User className="text-card-foreground" size={20} />
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Friends Sidebar */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-medium text-card-foreground">Chats</h2>
          </div>

          <FriendsList
            friends={friends}
            selectedFriend={selectedFriend}
            onFriendSelect={handleFriendSelect}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="bg-card border-b border-border px-4 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-secondary-foreground font-medium">
                      {selectedFriend.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-card-foreground" data-testid="text-friend-name">
                      {selectedFriend.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-container">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.senderId === user.id}
                  />
                ))}
              </div>

              {/* Message Input */}
              <div className="bg-card border-t border-border p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Type a message..."
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    data-testid="button-send"
                  >
                    Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="text-2xl text-primary" size={32} />
                </div>
                <h3 className="text-lg font-medium text-card-foreground mb-2">
                  Welcome to Rudra Chat
                </h3>
                <p>Select a friend to start chatting or add new friends to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
        />
      )}

      {showAddFriendModal && (
        <AddFriendModal
          userId={user.id}
          onClose={() => setShowAddFriendModal(false)}
          onFriendAdded={refetchFriends}
        />
      )}
    </div>
  );
}
