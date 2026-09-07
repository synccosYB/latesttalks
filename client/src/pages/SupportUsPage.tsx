import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, CreditCard, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import PaymentLogos from "@/components/PaymentLogos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SupportUsPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const { data: products } = useQuery<{
    donation: {
      id: string;
      name: string;
      description: string;
      price: { id: string };
    } | null;
  }>({
    queryKey: ["/api/stripe/products"],
  });

  const sponsorMutation = useMutation({
    mutationFn: async () => {
      if (!products?.donation?.price?.id) {
        throw new Error("Sponsorship not configured yet");
      }
      const res = await apiRequest("POST", "/api/stripe/create-donation-session", {
        priceId: products.donation.price.id,
        email,
        name,
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

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4" data-testid="text-page-title">
              Sponsor Latest Talks
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your sponsorship helps us continue creating top-quality Yiddish entertainment 
              and bringing you engaging conversations with fascinating guests.
            </p>
          </div>

          <div className="grid gap-6">
            {products?.donation && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Sponsor Online
                  </CardTitle>
                  <CardDescription>
                    Make a one-time sponsorship of any amount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name (optional)</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        data-testid="input-sponsor-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (for receipt)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="input-sponsor-email"
                      />
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      You'll choose your sponsorship amount on the next page • Default: $18 (Chai)
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => sponsorMutation.mutate()}
                    disabled={sponsorMutation.isPending}
                    data-testid="button-sponsor-online"
                  >
                    {sponsorMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Sponsor Now
                      </>
                    )}
                  </Button>
                  <div className="mt-4 flex flex-col items-center gap-2" data-testid="sponsor-payment-logos">
                    <PaymentLogos size="sm" />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Secure payment via Stripe</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Zelle
                </CardTitle>
                <CardDescription>
                  Send your sponsorship directly via Zelle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Send to:</p>
                  <p className="text-lg font-semibold" data-testid="text-zelle-email">
                    Sponsor@LatestTalks.com
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Latest Talks+ Membership
                </CardTitle>
                <CardDescription>
                  Get exclusive perks with a monthly sponsorship
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Become a Latest Talks+ member and get access to exclusive content, 
                  early access to episodes, and more!
                </p>
                <a
                  href="/plus"
                >
                  <Button data-testid="button-join-membership">
                    Join Latest Talks+
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Sponsor?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-sm font-semibold">1</span>
                    <span>Support the production of high-quality Yiddish content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-sm font-semibold">2</span>
                    <span>Help us bring more fascinating guests and stories</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-sm font-semibold">3</span>
                    <span>Enable us to upgrade our equipment and studio</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-sm font-semibold">4</span>
                    <span>Keep Yiddish entertainment alive and thriving</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Thank you for your support! Every contribution makes a difference.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
