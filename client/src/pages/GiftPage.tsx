import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Gift, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GiftPage() {
  const { toast } = useToast();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");

  const { data: products, isLoading } = useQuery<{
    gift: {
      id: string;
      name: string;
      description: string;
      prices: {
        monthly: { id: string; unit_amount: number } | null;
        annual: { id: string; unit_amount: number } | null;
      };
    } | null;
  }>({
    queryKey: ["/api/stripe/products"],
  });

  const giftMutation = useMutation({
    mutationFn: async () => {
      if (!products?.gift?.prices) {
        throw new Error("Gift subscriptions not configured yet");
      }
      const priceId = selectedPlan === "monthly" 
        ? products.gift.prices.monthly?.id 
        : products.gift.prices.annual?.id;
      
      if (!priceId) {
        throw new Error("Price not found");
      }

      if (!recipientEmail) {
        throw new Error("Please enter the recipient's email");
      }

      const res = await apiRequest("POST", "/api/stripe/create-gift-session", {
        priceId,
        buyerEmail,
        buyerName,
        recipientEmail,
        recipientName,
        message,
      });
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!products?.gift) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <div className="flex items-center justify-center py-24 px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Gift subscriptions are not yet available.</p>
              <p className="text-sm text-muted-foreground mt-2">Please check back later!</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4" data-testid="text-page-title">
              Gift Latest Talks+
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Give the gift of premium content! Buy a Latest Talks+ subscription 
              for a friend or family member.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gift Details</CardTitle>
              <CardDescription>
                Fill in the details below to send a gift subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Choose a plan</h3>
                <RadioGroup 
                  value={selectedPlan} 
                  onValueChange={(v) => setSelectedPlan(v as "monthly" | "annual")}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <Label
                    htmlFor="monthly"
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      selectedPlan === "monthly" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value="monthly" id="monthly" />
                    <div>
                      <p className="font-medium">1 Month</p>
                      <p className="text-sm text-muted-foreground">$9.99</p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="annual"
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      selectedPlan === "annual" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value="annual" id="annual" />
                    <div className="flex-1">
                      <p className="font-medium">1 Year</p>
                      <p className="text-sm text-muted-foreground">$119.99</p>
                    </div>
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                      Best Value
                    </span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium">Recipient Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient's Name</Label>
                    <Input
                      id="recipientName"
                      placeholder="Their name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      data-testid="input-recipient-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Recipient's Email *</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="their@email.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      required
                      data-testid="input-recipient-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Gift Message (optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    data-testid="input-gift-message"
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium">Your Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="buyerName">Your Name</Label>
                    <Input
                      id="buyerName"
                      placeholder="Your name"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      data-testid="input-buyer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerEmail">Your Email (for receipt)</Label>
                    <Input
                      id="buyerEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      data-testid="input-buyer-email"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">What they'll get:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Access to all premium episodes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Early access to new content
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Ad-free listening experience
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Exclusive member perks
                  </li>
                </ul>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => giftMutation.mutate()}
                disabled={giftMutation.isPending || !recipientEmail}
                data-testid="button-purchase-gift"
              >
                {giftMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Purchase Gift - ${selectedPlan === "monthly" ? "9.99" : "119.99"}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                The recipient will receive an email with instructions to activate their gift.
                Payments are securely processed by Stripe.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
