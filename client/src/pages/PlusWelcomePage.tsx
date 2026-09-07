import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMemberAuth } from "@/lib/memberAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Clock, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import ltPlusLogo from "@assets/LT+_Logo_1765168703665.png";

const MAX_RETRIES = 8;
const RETRY_INTERVAL_MS = 2000;

export default function PlusWelcomePage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { member, isLoading, isSubscribed, checkAuth } = useMemberAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  // Determine if we arrived via a Stripe redirect (hosted checkout or embedded redirect)
  const fromStripe =
    search.includes("session_id=") || search.includes("payment_intent=");

  // Once the initial auth load is done and member is logged in but not yet
  // subscribed, poll checkAuth until webhook settles (up to MAX_RETRIES).
  useEffect(() => {
    if (isLoading) return;
    if (!member) return; // handled by redirect effect below
    if (isSubscribed) return; // already active — nothing to do

    if (retryCount < MAX_RETRIES) {
      setRetrying(true);
      const timer = setTimeout(async () => {
        await checkAuth();
        setRetryCount((c) => c + 1);
        setRetrying(false);
      }, RETRY_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
  }, [isLoading, member, isSubscribed, retryCount, checkAuth]);

  // Redirect unauthenticated visitors away from this page immediately.
  useEffect(() => {
    if (!isLoading && !member) {
      setLocation("/plus");
    }
  }, [isLoading, member, setLocation]);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading || (!member && !isLoading)) {
    return (
      <div className="min-h-screen bg-[#F0EDEB] pt-16 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#10213A]" />
        </main>
        <Footer />
      </div>
    );
  }

  // ── Webhook still settling ───────────────────────────────────────────────────
  if (!isSubscribed) {
    const exhausted = retryCount >= MAX_RETRIES;
    return (
      <div className="min-h-screen bg-[#F0EDEB] pt-16 flex flex-col">
        <Header />
        <main className="flex-1 py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#10213A] rounded-2xl overflow-hidden shadow-xl mb-8">
              <div className="h-2 bg-[#DE2026]" />
              <div className="px-8 py-10 text-center">
                <img
                  src={ltPlusLogo}
                  alt="Latest Talks+"
                  className="h-14 mx-auto mb-8 object-contain"
                />
                {exhausted ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10 text-yellow-400" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                      Still processing…
                    </h1>
                    <p className="text-blue-200 leading-relaxed mb-2">
                      Your payment is being processed, but membership activation
                      is taking a little longer than usual. Please check back
                      shortly or email us and we'll sort it out right away.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center mx-auto mb-6">
                      <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                      Confirming your membership…
                    </h1>
                    <p className="text-blue-200 leading-relaxed">
                      Your payment was received. We're activating your account —
                      this usually takes just a moment.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
              <div className="border-l-4 border-[#10213A] px-8 py-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#10213A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-6 h-6 text-[#10213A]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#10213A] mb-2">
                      Need help?
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      If your account doesn't activate within a few minutes,
                      please reach out and we'll get you sorted right away.
                    </p>
                    <a
                      href="mailto:hello@latesttalks.com"
                      className="inline-flex items-center gap-2 text-[#DE2026] hover:text-[#c41c22] font-medium transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      hello@latesttalks.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setLocation("/")}
                className="flex-1 bg-[#DE2026] hover:bg-[#c41c22] text-white h-12 text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Latest Talks
              </Button>
              <Button
                onClick={() => setLocation("/plus/account")}
                variant="outline"
                className="flex-1 border-[#10213A] text-[#10213A] hover:bg-[#10213A] hover:text-white h-12 text-base"
              >
                View My Account
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Verified active member — full success page ───────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0EDEB] pt-16 flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Hero card */}
          <div className="bg-[#10213A] rounded-2xl overflow-hidden shadow-xl mb-8">
            <div className="h-2 bg-[#DE2026]" />
            <div className="px-8 py-10 text-center">
              <img
                src={ltPlusLogo}
                alt="Latest Talks+"
                className="h-14 mx-auto mb-8 object-contain"
              />
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                You're in!
              </h1>
              <p className="text-blue-200 text-lg leading-relaxed mb-2">
                Thank you — your Latest Talks+ membership is now active.
              </p>
              <p className="text-blue-300/70 text-sm">
                Welcome to the community. We're so glad you're here.
              </p>
            </div>
          </div>

          {/* Coming soon card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <div className="border-l-4 border-[#DE2026] px-8 py-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#DE2026]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-6 h-6 text-[#DE2026]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#10213A] mb-2">
                    Premium content launching soon
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    We're putting the finishing touches on exclusive episodes,
                    in-depth conversations, and members-only extras. Your
                    membership ensures you'll be among the very first to access
                    everything when we go live.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stay in touch card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
            <div className="border-l-4 border-[#10213A] px-8 py-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#10213A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-6 h-6 text-[#10213A]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#10213A] mb-2">
                    Stay tuned
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    We'll email you as soon as new premium content drops. In the
                    meantime, feel free to reach out — we love hearing from our
                    members.
                  </p>
                  <a
                    href="mailto:hello@latesttalks.com"
                    className="inline-flex items-center gap-2 text-[#DE2026] hover:text-[#c41c22] font-medium transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    hello@latesttalks.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setLocation("/")}
              className="flex-1 bg-[#DE2026] hover:bg-[#c41c22] text-white h-12 text-base"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Latest Talks
            </Button>
            <Button
              onClick={() => setLocation("/plus/account")}
              variant="outline"
              className="flex-1 border-[#10213A] text-[#10213A] hover:bg-[#10213A] hover:text-white h-12 text-base"
            >
              View My Account
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
