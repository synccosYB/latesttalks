import { useState } from "react";
import { useLocation } from "wouter";
import { useMemberAuth } from "@/lib/memberAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Crown, User, Mail, Phone, CreditCard, Calendar, LogOut, Settings, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import StripePaymentForm from "@/components/StripePaymentForm";
import ltPlusLogo from "@assets/LT+_Logo_1765168703665.png";

export default function MemberAccountPage() {
  const [, setLocation] = useLocation();
  const { member, isSubscribed, logout, isLoading, checkAuth } = useMemberAuth();
  const { toast } = useToast();
  const [isManaging, setIsManaging] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0EDEB] pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DE2026]"></div>
      </div>
    );
  }

  if (!member) {
    setLocation("/plus/login");
    return null;
  }

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const res = await apiRequest("POST", "/api/stripe/create-portal-session");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to open subscription portal",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to manage subscription",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  const handleSubscribe = async () => {
    setIsCreatingIntent(true);
    try {
      const res = await apiRequest("POST", "/api/stripe/create-subscription-intent", { plan: selectedPlan });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPaymentForm(true);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to initialize payment",
          variant: "destructive",
        });
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
    setShowPaymentForm(false);
    setClientSecret(null);
    checkAuth();
    toast({
      title: "Welcome to Latest Talks+!",
      description: "Your subscription is now active. Enjoy premium content!",
    });
    setLocation("/plus/welcome");
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
  };

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged out", description: "You've been successfully logged out." });
    setLocation("/plus");
  };

  const getStatusBadge = () => {
    switch (member.subscriptionStatus) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "past_due":
        return <Badge className="bg-yellow-500">Past Due</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-400">Inactive</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EDEB] pt-16">
      <Header />
      
      <main className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={ltPlusLogo} alt="Latest Talks+" className="h-16 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-[#10213A]" data-testid="text-title">Your Account</h1>
            <p className="text-gray-600 mt-2">Manage your membership</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium" data-testid="text-email">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium" data-testid="text-name">{member.name}</p>
                  </div>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{member.phone}</p>
                    </div>
                  </div>
                )}
                {member.createdAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium">{format(new Date(member.createdAt), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Subscription
                  </CardTitle>
                  {getStatusBadge()}
                </div>
              </CardHeader>
              <CardContent>
                {isSubscribed ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">Your membership is active!</p>
                      <p className="text-green-600 text-sm mt-1">
                        Thank you for supporting the channel. You have full access to all premium content.
                      </p>
                    </div>
                    {member.subscriptionEndDate && (
                      <p className="text-sm text-gray-500">
                        Next billing date: {format(new Date(member.subscriptionEndDate), "MMMM d, yyyy")}
                      </p>
                    )}
                    <Button
                      onClick={handleManageSubscription}
                      disabled={isManaging}
                      variant="outline"
                      className="w-full"
                      data-testid="button-manage-subscription"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {isManaging ? "Opening..." : "Manage Membership"}
                    </Button>
                  </div>
                ) : showPaymentForm && clientSecret ? (
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    plan={selectedPlan}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-800 font-medium">No active membership</p>
                      <p className="text-gray-600 text-sm mt-1">
                        Sponsor to support the channel and access all premium content.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Choose your plan:</Label>
                      <RadioGroup
                        value={selectedPlan}
                        onValueChange={(v) => setSelectedPlan(v as "monthly" | "yearly")}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="monthly" id="monthly" data-testid="radio-monthly" />
                          <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                            <span className="font-medium">Monthly</span>
                            <span className="text-gray-600 ml-2">$9.99/month</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer border-[#DE2026]">
                          <RadioGroupItem value="yearly" id="yearly" data-testid="radio-yearly" />
                          <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                            <span className="font-medium">Yearly</span>
                            <span className="text-gray-600 ml-2">$120/year</span>
                            <Badge className="ml-2 bg-green-500">Best Value</Badge>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Button
                      onClick={handleSubscribe}
                      disabled={isCreatingIntent}
                      className="w-full bg-[#DE2026] hover:bg-[#c41c22]"
                      data-testid="button-subscribe"
                    >
                      {isCreatingIntent ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Continue to Payment
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
