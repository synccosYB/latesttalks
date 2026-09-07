import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8" data-testid="text-page-title">Terms of Service</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">Last updated: December 2025</p>
            
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Agreement to Terms</h2>
              <p className="text-foreground/80">
                By accessing or using Latest Talks ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="text-foreground/80">
                Latest Talks is a Yiddish podcast platform providing video and audio content, including interviews, discussions, and entertainment. We offer both free content and premium content through our Latest Talks+ subscription service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
              <p className="text-foreground/80">To access certain features, you may need to create an account. You agree to:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Latest Talks+ Subscription</h2>
              <p className="text-foreground/80">If you subscribe to Latest Talks+:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li><strong>Pricing:</strong> Subscriptions are available at $9.99/month or $120/year</li>
                <li><strong>Billing:</strong> Subscriptions are billed in advance on a recurring basis</li>
                <li><strong>Cancellation:</strong> You may cancel your subscription at any time. Access continues until the end of your billing period</li>
                <li><strong>Refunds:</strong> Refunds are handled on a case-by-case basis. Contact us for refund requests</li>
                <li><strong>Content Access:</strong> Premium content is for personal use only and may not be shared or redistributed</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Acceptable Use</h2>
              <p className="text-foreground/80">You agree not to:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Share, redistribute, or publicly display premium content without authorization</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Post offensive, defamatory, or harmful content in community areas</li>
                <li>Use automated systems to access the Service without permission</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Intellectual Property</h2>
              <p className="text-foreground/80">
                All content on Latest Talks, including videos, audio, graphics, and text, is owned by Latest Talks or our content creators. You may not copy, modify, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">7. User-Generated Content</h2>
              <p className="text-foreground/80">
                If you submit content (such as community photos, comments, or discussions):
              </p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li>You retain ownership of your content</li>
                <li>You grant us a license to use, display, and distribute your content</li>
                <li>You are responsible for ensuring you have rights to submit the content</li>
                <li>We may remove content that violates these terms</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">8. Disclaimer of Warranties</h2>
              <p className="text-foreground/80">
                The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
              <p className="text-foreground/80">
                To the maximum extent permitted by law, Latest Talks shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">10. Termination</h2>
              <p className="text-foreground/80">
                We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">11. Changes to Terms</h2>
              <p className="text-foreground/80">
                We may modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">12. Governing Law</h2>
              <p className="text-foreground/80">
                These terms are governed by the laws of the State of New York, United States, without regard to conflict of law principles.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">13. Contact Us</h2>
              <p className="text-foreground/80">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-foreground/80">
                Email: <a href="mailto:legal@latesttalks.com" className="text-primary hover:underline">legal@latesttalks.com</a>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">14. Related Policies</h2>
              <p className="text-foreground/80">
                Please also review our{" "}
                <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
                <Link href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
