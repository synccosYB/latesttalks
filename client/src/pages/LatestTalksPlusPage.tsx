import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemberAuth } from "@/lib/memberAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Star, Play, Lock, Crown, Headphones, Video, Users, CreditCard, Phone, Mail, User, Calendar, Loader2, ShieldCheck } from "lucide-react";
import PaymentLogos from "@/components/PaymentLogos";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Episode } from "@shared/schema";
import ltPlusLogo from "@assets/LT+_Logo_1765168703665.png";
import StripePaymentForm from "@/components/StripePaymentForm";

export default function LatestTalksPlusPage() {
  const [, setLocation] = useLocation();
  const { member, isSubscribed, isLoading, checkAuth } = useMemberAuth();
  const { toast } = useToast();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  const { data: premiumEpisodes = [] } = useQuery<(Episode & { isLocked?: boolean })[]>({
    queryKey: ["/api/premium-episodes"],
  });

  const handlePlanSelect = async (plan: "monthly" | "yearly") => {
    if (isSubscribed) {
      setLocation("/plus/account");
      return;
    }

    if (!member) {
      localStorage.setItem("pendingPlan", plan);
      setLocation("/plus/login");
      return;
    }

    setSelectedPlan(plan);
    setIsCreatingIntent(true);
    
    try {
      const res = await apiRequest("POST", "/api/stripe/create-subscription-intent", { plan });
      const data = await res.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPaymentDialog(true);
      } else {
        throw new Error(data.error || "Failed to create payment");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setClientSecret(null);
    checkAuth();
    toast({
      title: "Welcome to Latest Talks+!",
      description: "Your subscription is now active. Enjoy premium content!",
    });
    setLocation("/plus/welcome");
  };

  const benefits = [
    { icon: Video, title: "Exclusive Content", description: "Access to premium episodes and behind-the-scenes footage" },
    { icon: Headphones, title: "Early Access", description: "Get new episodes before they go public" },
    { icon: Users, title: "Community", description: "Join our exclusive member community" },
    { icon: Star, title: "Ad-Free Experience", description: "Enjoy premium content without interruptions" },
  ];

  return (
    <div className="min-h-screen bg-[#F0EDEB] pt-16">
      <Header />
      
      <main>
        <section className="text-[#10213A] py-20" style={{ backgroundColor: '#b0cbde' }}>
          <div className="max-w-6xl mx-auto px-4 text-center">
            <Badge className="bg-[#DE2026] text-white mb-6 text-lg px-4 py-1" data-testid="badge-premium">
              <Crown className="w-4 h-4 mr-2" />
              Premium Membership
            </Badge>
            <div className="flex justify-center mb-6">
              <img 
                src={ltPlusLogo} 
                alt="Latest Talks+" 
                className="h-20 md:h-28 object-contain"
                data-testid="img-lt-plus-logo"
              />
            </div>
            <p className="text-xl text-[#10213A] mb-8 max-w-2xl mx-auto">
              Support us with $10 a month and unlock premium content, early access to episodes, the ability to submit questions for upcoming guests, plus more perks as the community grows.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto items-stretch">
              <Card className="bg-[#10213A]/10 backdrop-blur border-[#10213A]/20 hover-elevate flex flex-col">
                <CardContent className="pt-6 flex flex-col flex-1">
                  <div className="text-center mb-4">
                    <Badge className="bg-[#10213A]/20 text-[#10213A] mb-3">Monthly</Badge>
                    <div>
                      <span className="text-4xl font-bold text-[#10213A]">$9.99</span>
                      <span className="text-[#10213A]/70">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6 text-left text-sm flex-1 text-[#10213A]">
                    {["All premium episodes", "Early access", "Ad-free experience", "Cancel anytime"].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePlanSelect("monthly")}
                    disabled={isLoading}
                    className="w-full bg-[#10213A] hover:bg-[#10213A]/80 text-white mt-auto"
                    data-testid="button-subscribe-monthly"
                  >
                    {isLoading ? "Loading..." : isSubscribed ? "Manage Subscription" : "Choose Monthly"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#DE2026]/10 backdrop-blur border-[#DE2026]/30 hover-elevate flex flex-col">
                <CardContent className="pt-6 flex flex-col flex-1">
                  <div className="text-center mb-4">
                    <Badge className="bg-[#10213A]/20 text-[#10213A] mb-3">Annual</Badge>
                    <div>
                      <span className="text-4xl font-bold text-[#10213A]">$120</span>
                      <span className="text-[#10213A]/70">/year</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6 text-left text-sm flex-1 text-[#10213A]">
                    {["All premium episodes", "Early access", "Ad-free experience", "Priority support"].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePlanSelect("yearly")}
                    disabled={isLoading}
                    className="w-full bg-[#DE2026] hover:bg-[#c41c22] text-white mt-auto"
                    data-testid="button-subscribe-annual"
                  >
                    {isLoading ? "Loading..." : isSubscribed ? "Manage Subscription" : "Choose Annual"}
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="mt-8 flex flex-col items-center gap-3" data-testid="payment-logos-section">
              <PaymentLogos size="lg" />
              <div className="flex items-center gap-1.5 text-sm text-[#10213A]/70">
                <ShieldCheck className="h-4 w-4" />
                <span>Secure payment powered by Stripe</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-[#10213A] text-center mb-12" data-testid="text-benefits-title">
              Member Benefits
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, i) => (
                <Card key={i} className="text-center hover-elevate">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-[#DE2026]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="w-8 h-8 text-[#DE2026]" />
                    </div>
                    <h3 className="font-semibold text-[#10213A] mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-[#10213A] text-center mb-4" data-testid="text-exclusive-title">
              Exclusive Content
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Get access to premium episodes and content only available to Latest Talks+ members
            </p>
            
            {premiumEpisodes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {premiumEpisodes.map((episode) => (
                  <Card key={episode.id} className="overflow-hidden hover-elevate" data-testid={`card-premium-episode-${episode.id}`}>
                    <div className="relative aspect-video bg-gray-200">
                      {episode.thumbnailUrl ? (
                        <img
                          src={episode.thumbnailUrl}
                          alt={episode.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#10213A]">
                          <Play className="w-12 h-12 text-white/50" />
                        </div>
                      )}
                      {episode.isLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Lock className="w-10 h-10 mx-auto mb-2" />
                            <span className="text-sm">Members Only</span>
                          </div>
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-[#DE2026]">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{episode.title}</CardTitle>
                      {episode.guestName && (
                        <CardDescription>{episode.guestName}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Crown className="w-16 h-16 text-[#DE2026] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#10213A] mb-2">Premium Content Coming Soon</h3>
                  <p className="text-gray-600">
                    Sponsor now to be the first to access exclusive episodes when they launch!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-[#10213A] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Join?</h2>
            <p className="text-gray-300 mb-8">
              Get unlimited access to all premium content by supporting us with $9.99/month. Cancel anytime.
            </p>
            <Button
              onClick={() => handlePlanSelect("monthly")}
              disabled={isLoading || isCreatingIntent}
              size="lg"
              className="bg-[#DE2026] hover:bg-[#c41c22] text-white px-8"
              data-testid="button-subscribe-bottom"
            >
              {isCreatingIntent ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : isSubscribed ? "Manage Membership" : "Subscribe Now"}
            </Button>
          </div>
        </section>
      </main>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#10213A]">
              <img src={ltPlusLogo} alt="LT+" className="h-6 object-contain" />
              Complete Your Subscription
            </DialogTitle>
            <DialogDescription>
              {selectedPlan === "yearly" ? "$120/year - Annual Plan" : "$9.99/month - Monthly Plan"}
            </DialogDescription>
          </DialogHeader>
          
          {clientSecret && (
            <StripePaymentForm
              clientSecret={clientSecret}
              plan={selectedPlan}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setShowPaymentDialog(false);
                setClientSecret(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
