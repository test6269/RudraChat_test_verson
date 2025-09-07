import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Info, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddFriendModalProps {
  userId: string;
  onClose: () => void;
  onFriendAdded: () => void;
}

export default function AddFriendModal({ userId, onClose, onFriendAdded }: AddFriendModalProps) {
  const [friendRno, setFriendRno] = useState("");
  const { toast } = useToast();

  const addFriendMutation = useMutation({
    mutationFn: async (rno: string) => {
      const response = await apiRequest("POST", "/api/friends", {
        userId,
        friendRno: rno,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend Added",
        description: "Friend has been successfully added to your contacts.",
      });
      onFriendAdded();
      onClose();
    },
    onError: () => {
      toast({
        title: "Add Friend Failed",
        description: "Friend not found or already added. Please check the r_no and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (friendRno.trim()) {
      addFriendMutation.mutate(friendRno.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full slide-up">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Add Friend</h3>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-add-friend" className="icon-hover">
              <X className="icon-default" size={20} />
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="friend-rno" className="text-sm font-medium text-card-foreground mb-2">
                  Friend's Rudra Config Number (r_no)
                </Label>
                <Input
                  id="friend-rno"
                  type="text"
                  placeholder="RUD-XXXXXXX"
                  value={friendRno}
                  onChange={(e) => setFriendRno(e.target.value)}
                  className="font-mono input-modern"
                  data-testid="input-friend-rno"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="text-primary mt-0.5" size={16} />
                  <p className="text-sm text-muted-foreground">
                    Enter your friend's r_no to add them to your contacts. You'll be able to start
                    chatting immediately.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  data-testid="button-cancel-add-friend"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 btn-teal"
                  disabled={!friendRno.trim() || addFriendMutation.isPending}
                  data-testid="button-add-friend-submit"
                >
                  {addFriendMutation.isPending ? "Adding..." : "Add Friend"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
