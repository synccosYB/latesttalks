import { Link } from "wouter";
import { Crown } from "lucide-react";
import { SiInstagram, SiLinkedin, SiTelegram, SiYoutube, SiX } from "react-icons/si";
import logoUrl from "@assets/Latest Talks Logo png[1]_1764563665460.png";
import BugReportDialog from "@/components/BugReportDialog";

const socialLinks = [
  { href: "https://www.instagram.com/latest_talks/", icon: SiInstagram, label: "Instagram" },
  { href: "https://www.linkedin.com/company/latesttalks", icon: SiLinkedin, label: "LinkedIn" },
  { href: "https://t.me/Latest_Talks", icon: SiTelegram, label: "Telegram" },
  { href: "https://www.youtube.com/c/LatestTalks", icon: SiYoutube, label: "YouTube" },
  { href: "https://x.com/latest_talks", icon: SiX, label: "X" },
];

const quickLinks = [
  { href: "/podcast", label: "Episodes" },
  { href: "/hosts", label: "Meet the Hosts" },
  { href: "/guests", label: "Guest Profiles" },
];

const moreLinks = [
  { href: "/sponsors", label: "Our Sponsors" },
  { href: "/community", label: "Community" },
  { href: "/sponsor", label: "Support Us" },
  { href: "/in-flight", label: "In-Flight Entertainment" },
];

export default function Footer() {
  return (
    <footer className="gradient-hero-enhanced text-white relative overflow-hidden">
      {/* Top gradient accent bar */}
      <div className="h-1 w-full gradient-accent" />
      
      {/* Decorative elements */}
      <div className="bg-blob w-64 h-64 bg-primary/15 -bottom-20 -right-20" />
      <div className="bg-blob w-48 h-48 bg-purple-500/10 top-20 -left-10" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Main content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand column */}
          <div className="md:col-span-4">
            <img 
              src={logoUrl} 
              alt="Latest Talks" 
              className="h-12 w-auto mb-5 drop-shadow-lg"
              data-testid="img-footer-logo"
            />
            <p className="text-white/60 text-sm max-w-xs leading-relaxed mb-6">
              The Biggest Jewish Network in Yiddish. Top-quality entertainment through engaging conversations.
            </p>
            <Link href="/plus">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-lg border border-primary/30 text-sm font-medium hover:bg-primary/30 transition-all duration-[250ms]">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-white">Join Latest Talks+</span>
              </span>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white/90 mb-5">Browse</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-white/60 hover:text-primary text-sm transition-colors duration-[250ms]" 
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Links */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white/90 mb-5">More</h3>
            <ul className="space-y-3">
              {moreLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-white/60 hover:text-primary text-sm transition-colors duration-[250ms]" 
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div className="md:col-span-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white/90 mb-5">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-white/60 mb-6">
              <li>
                <Link 
                  href="/contact" 
                  className="hover:text-primary transition-colors duration-[250ms]" 
                  data-testid="link-footer-contact"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:hello@latesttalks.com" 
                  className="hover:text-primary transition-colors duration-[250ms]" 
                  data-testid="link-email-hello"
                >
                  hello@latesttalks.com
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/17188121400?text=Subscribe" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary transition-colors duration-[250ms]" 
                  data-testid="link-whatsapp"
                >
                  WhatsApp Updates
                </a>
              </li>
            </ul>

            {/* Social links with hover effects */}
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-white/50 hover:text-primary hover:bg-white/5 rounded-lg transition-all duration-[250ms] hover:scale-110"
                  data-testid={`link-footer-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Bottom bar - single line with sections */}
        <div className="py-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-white/40">
          <span>&copy; {new Date().getFullYear()} Latest Talks. All rights reserved.</span>
          <span className="text-white/20">|</span>
          <Link 
            href="/privacy-policy" 
            className="hover:text-primary transition-colors duration-[250ms]"
            data-testid="link-footer-privacy"
          >
            Privacy Policy
          </Link>
          <span className="text-white/20">|</span>
          <Link 
            href="/cookie-policy" 
            className="hover:text-primary transition-colors duration-[250ms]"
            data-testid="link-footer-cookies"
          >
            Cookie Policy
          </Link>
          <span className="text-white/20">|</span>
          <Link 
            href="/terms-of-service" 
            className="hover:text-primary transition-colors duration-[250ms]"
            data-testid="link-footer-terms"
          >
            Terms of Service
          </Link>
          <span className="text-white/20">|</span>
          <span>
            Website empowered by{" "}
            <a 
              href="https://synkdex.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 underline hover:text-blue-300 transition-colors"
            >
              synkdex.com
            </a>
          </span>
          <span className="text-white/20">|</span>
          <BugReportDialog 
            trigger={
              <button className="hover:text-primary transition-colors duration-[250ms]" data-testid="button-footer-report-bug">
                Report a Bug
              </button>
            }
          />
          <span className="text-white/20">|</span>
          <a 
            href="/admin/login" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors duration-[250ms]"
            data-testid="link-footer-admin"
          >
            Admin Portal
          </a>
        </div>
      </div>
    </footer>
  );
}
