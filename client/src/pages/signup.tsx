import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MessageCircle, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [showRnoModal, setShowRnoModal] = useState(false);
  const [generatedRno, setGeneratedRno] = useState("");
  const { toast } = useToast();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/signup", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedRno(data.rno);
      setShowRnoModal(true);
    },
    onError: () => {
      toast({
        title: "Signup Failed",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    signupMutation.mutate(data);
  };

  const handleContinueToLogin = () => {
    setShowRnoModal(false);
    setLocation("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <MessageCircle className="text-2xl text-primary-foreground" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Rudra Chat</h1>
          <p className="text-muted-foreground mt-2">Secure real-time messaging</p>
        </div>

        {/* Signup Form */}
        <Card className="slide-up">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  data-testid="input-name"
                  {...form.register("name")}
                  className="mt-2"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  data-testid="input-password"
                  {...form.register("password")}
                  className="mt-2"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-primary hover:underline"
                  data-testid="link-signin"
                >
                  Sign In
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* R_NO Display Modal */}
        {showRnoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full slide-up">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key className="text-primary" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    Account Created Successfully!
                  </h3>

                  <div className="bg-muted border border-border rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Your Rudra Config Number (r_no):
                    </p>
                    <p className="text-2xl font-bold text-primary font-mono" data-testid="text-rno">
                      {generatedRno}
                    </p>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="text-destructive mt-0.5" size={16} />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Important Security Notice
                        </p>
                        <p className="text-xs text-destructive/80 mt-1">
                          This is your Rudra Config Number (r_no). Share it only with friends you
                          want to chat with. Do not share it publicly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleContinueToLogin}
                    className="w-full"
                    data-testid="button-continue-login"
                  >
                    Continue to Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
