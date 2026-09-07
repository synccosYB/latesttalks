import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8" data-testid="text-page-title">Privacy Policy</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">Last updated: December 2025</p>
            
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
              <p className="text-foreground/80">
                Welcome to Latest Talks ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
              <p className="text-foreground/80">We may collect the following types of information:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li><strong>Personal Information:</strong> Name, email address, phone number when you subscribe to our newsletter, create an account, or contact us.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our website, including pages visited, time spent, and viewing patterns.</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
                <li><strong>Payment Information:</strong> For Latest Talks+ subscribers, we collect payment details through our secure payment processor (Stripe).</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
              <p className="text-foreground/80">We use collected information to:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Send newsletters and updates about new episodes</li>
                <li>Process membership subscriptions and payments</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Improve our website and content</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Information Sharing</h2>
              <p className="text-foreground/80">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li>Service providers who assist in operating our website</li>
                <li>Payment processors for subscription transactions</li>
                <li>Analytics providers to understand website usage</li>
                <li>Law enforcement when required by law</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
              <p className="text-foreground/80">
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
              <p className="text-foreground/80">You have the right to:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Unsubscribe from marketing communications</li>
                <li>Opt-out of cookies (see our <Link href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">7. Children's Privacy</h2>
              <p className="text-foreground/80">
                Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">8. Changes to This Policy</h2>
              <p className="text-foreground/80">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
              <p className="text-foreground/80">
                If you have questions about this privacy policy, please contact us at:
              </p>
              <p className="text-foreground/80">
                Email: <a href="mailto:privacy@latesttalks.com" className="text-primary hover:underline">privacy@latesttalks.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
