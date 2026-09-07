import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/subscribers", { email });
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "You'll receive updates about new episodes.",
      });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      subscribeMutation.mutate(email);
    }
  };

  return (
    <div className="gradient-accent rounded-lg p-4 text-white relative overflow-hidden">
      <div className="absolute inset-0 shimmer opacity-20" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base">Stay Updated</h3>
            <p className="text-xs text-white/80">Get notified about new episodes</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white focus:ring-white"
            data-testid="input-newsletter-email"
          />
          <Button 
            type="submit" 
            disabled={subscribeMutation.isPending}
            className="bg-white text-primary font-semibold w-full"
            data-testid="button-subscribe"
          >
            {subscribeMutation.isPending ? "..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </div>
  );
}
