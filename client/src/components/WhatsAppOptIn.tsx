import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WhatsAppOptInProps {
  variant?: "inline" | "card";
  className?: string;
}

export default function WhatsAppOptIn({ variant = "inline", className = "" }: WhatsAppOptInProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const optInMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; name: string }) => {
      const res = await apiRequest("POST", "/api/whatsapp/contacts/opt-in", data);
      return res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      setPhoneNumber("");
      setName("");
      toast({ 
        title: "You're subscribed!", 
        description: "You'll receive new episode alerts on WhatsApp." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Subscription failed", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({ 
        title: "Phone number required", 
        variant: "destructive" 
      });
      return;
    }
    optInMutation.mutate({ phoneNumber: phoneNumber.trim(), name: name.trim() });
  };

  if (isSuccess) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-800">Subscribed to WhatsApp Updates</p>
          <p className="text-sm text-green-600">
            You'll receive alerts when new episodes are released!
          </p>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-4 bg-[#10213A] text-white rounded-lg ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-green-500 rounded-lg flex-shrink-0">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base">Get WhatsApp Alerts</h3>
            <p className="text-xs text-gray-300">Be first to know about new episodes</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              data-testid="input-whatsapp-name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="phone-input-wrapper min-w-0 w-full" data-testid="input-whatsapp-phone">
              <PhoneInput
                international
                defaultCountry="US"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value || "")}
                className="flex h-9 w-full rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-white shadow-sm transition-colors placeholder:text-gray-400 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
              />
            </div>
            <Button 
              type="submit" 
              className="bg-green-500 text-white w-full"
              disabled={optInMutation.isPending}
              data-testid="button-whatsapp-subscribe"
            >
              {optInMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Subscribe"
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            We'll only send new episode alerts. Unsubscribe anytime.
          </p>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row items-stretch gap-2 ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
        <MessageCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">WhatsApp Updates</span>
      </div>
      <Input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="sm:w-32"
        data-testid="input-whatsapp-name-inline"
      />
      <div className="phone-input-wrapper sm:w-48" data-testid="input-whatsapp-phone-inline">
        <PhoneInput
          international
          defaultCountry="US"
          value={phoneNumber}
          onChange={(value) => setPhoneNumber(value || "")}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
        />
      </div>
      <Button 
        type="submit" 
        variant="default"
        className="bg-green-600 hover:bg-green-700"
        disabled={optInMutation.isPending}
        data-testid="button-whatsapp-subscribe-inline"
      >
        {optInMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Get Alerts"
        )}
      </Button>
    </form>
  );
}
