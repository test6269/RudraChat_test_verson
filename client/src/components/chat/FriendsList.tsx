import type { User } from "@shared/schema";

interface FriendsListProps {
  friends: User[];
  selectedFriend: User | null;
  onFriendSelect: (friend: User) => void;
}

export default function FriendsList({ friends, selectedFriend, onFriendSelect }: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-4">
        <div className="text-muted-foreground">
          <p className="text-sm">No friends yet</p>
          <p className="text-xs mt-1">Add friends to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {friends.map((friend) => (
        <div
          key={friend.id}
          onClick={() => onFriendSelect(friend)}
          className={`p-4 hover:bg-accent cursor-pointer border-b border-border/50 transition-colors ${
            selectedFriend?.id === friend.id ? "bg-accent" : ""
          }`}
          data-testid={`friend-item-${friend.id}`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-secondary-foreground font-medium" data-testid="text-friend-initials">
                {friend.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-card-foreground truncate" data-testid="text-friend-name">
                  {friend.name}
                </h3>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
