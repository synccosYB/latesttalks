import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8" data-testid="text-page-title">Cookie Policy</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">Last updated: December 2025</p>
            
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. What Are Cookies</h2>
              <p className="text-foreground/80">
                Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. How We Use Cookies</h2>
              <p className="text-foreground/80">Latest Talks uses cookies for the following purposes:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly, including user authentication and session management.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting anonymous information.</li>
                <li><strong>Preference Cookies:</strong> Remember your preferences, such as language settings and display preferences.</li>
                <li><strong>Marketing Cookies:</strong> Used to track visitors across websites to display relevant advertisements.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. Types of Cookies We Use</h2>
              
              <div className="bg-card border rounded-md p-4 space-y-3">
                <h3 className="font-medium text-foreground">Session Cookies</h3>
                <p className="text-sm text-foreground/80">Temporary cookies that are deleted when you close your browser. Used for maintaining your session while browsing.</p>
              </div>
              
              <div className="bg-card border rounded-md p-4 space-y-3">
                <h3 className="font-medium text-foreground">Persistent Cookies</h3>
                <p className="text-sm text-foreground/80">Remain on your device for a set period. Used to remember your preferences and login information.</p>
              </div>
              
              <div className="bg-card border rounded-md p-4 space-y-3">
                <h3 className="font-medium text-foreground">Third-Party Cookies</h3>
                <p className="text-sm text-foreground/80">Set by third-party services we use, such as YouTube (for video embedding), Stripe (for payments), and analytics providers.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Third-Party Services</h2>
              <p className="text-foreground/80">We use the following third-party services that may set cookies:</p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li><strong>YouTube:</strong> For embedding video content</li>
                <li><strong>Stripe:</strong> For processing payments</li>
                <li><strong>Google Analytics:</strong> For website analytics (if enabled)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Managing Cookies</h2>
              <p className="text-foreground/80">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc pl-6 text-foreground/80 space-y-2">
                <li><strong>Browser Settings:</strong> Most browsers allow you to refuse cookies or delete existing cookies through the settings menu.</li>
                <li><strong>Third-Party Tools:</strong> You can use browser extensions to manage cookies and tracking.</li>
              </ul>
              <p className="text-foreground/80 mt-4">
                Please note that disabling cookies may affect the functionality of our website and your user experience.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Updates to This Policy</h2>
              <p className="text-foreground/80">
                We may update this cookie policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">7. Contact Us</h2>
              <p className="text-foreground/80">
                If you have questions about our use of cookies, please contact us at:
              </p>
              <p className="text-foreground/80">
                Email: <a href="mailto:privacy@latesttalks.com" className="text-primary hover:underline">privacy@latesttalks.com</a>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">8. Related Policies</h2>
              <p className="text-foreground/80">
                For more information about how we handle your data, please see our{" "}
                <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
                <Link href="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
