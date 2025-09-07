import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, LogOut, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfileModal({ user, onClose, onLogout }: ProfileModalProps) {
  const [name, setName] = useState(user.name);
  const { toast } = useToast();

  const updateProfileMutation = useMutation({
    mutationFn: async (newName: string) => {
      const response = await apiRequest("PUT", `/api/users/${user.id}`, { name: newName });
      return await response.json();
    },
    onSuccess: (data) => {
      // Update sessionStorage with new user data
      sessionStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveChanges = () => {
    if (name.trim() && name !== user.name) {
      updateProfileMutation.mutate(name.trim());
    } else {
      onClose();
    }
  };

  const handleCopyRno = async () => {
    try {
      await navigator.clipboard.writeText(user.rno);
      toast({
        title: "Copied!",
        description: "Your r_no has been copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy r_no to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full slide-up">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-card-foreground">Profile & Settings</h3>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-profile">
              <X className="text-muted-foreground" size={20} />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary-foreground">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </span>
              </div>
            </div>

            {/* R_NO Display */}
            <div>
              <Label className="text-sm font-medium text-card-foreground mb-2">
                Your Rudra Config Number (r_no)
              </Label>
              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-primary" data-testid="text-user-rno">
                    {user.rno}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyRno}
                    className="h-6 w-6"
                    data-testid="button-copy-rno"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Share this with friends to let them add you
              </p>
            </div>

            {/* Name Edit */}
            <div>
              <Label htmlFor="profile-name" className="text-sm font-medium text-card-foreground mb-2">
                Name
              </Label>
              <Input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-profile-name"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleSaveChanges}
                className="w-full"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-changes"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                variant="outline"
                onClick={onLogout}
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
                data-testid="button-logout"
              >
                <LogOut className="mr-2" size={16} />
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
