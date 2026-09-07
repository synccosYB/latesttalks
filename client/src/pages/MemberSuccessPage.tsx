import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMemberAuth } from "@/lib/memberAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Crown, ArrowRight } from "lucide-react";

export default function MemberSuccessPage() {
  const [, setLocation] = useLocation();
  const { checkAuth, member, isSubscribed } = useMemberAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen bg-[#F0EDEB] pt-16">
      <Header />
      
      <main className="py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-green-600 py-8">
              <CheckCircle className="w-20 h-20 text-white mx-auto" />
            </div>
            <CardContent className="pt-8 pb-8">
              <h1 className="text-3xl font-bold text-[#10213A] mb-4" data-testid="text-title">
                Welcome to Latest Talks+!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for your donation! Your membership has been activated successfully. You now have full access to all premium content!
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => setLocation("/plus")}
                  className="w-full bg-[#DE2026] hover:bg-[#c41c22]"
                  data-testid="button-explore"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Explore Premium Content
                </Button>
                <Button
                  onClick={() => setLocation("/plus/account")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-account"
                >
                  View My Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
