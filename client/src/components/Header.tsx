import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Search, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiInstagram, SiLinkedin, SiTelegram, SiYoutube, SiX } from "react-icons/si";
import logoUrl from "@assets/Latest Talks Logo png[1]_1764563665460.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/podcast", label: "Podcast" },
  { href: "/hosts", label: "Hosts" },
  { href: "/guests", label: "Guests" },
  { href: "/apply", label: "Be a Guest" },
  { href: "/ads", label: "Advertise" },
  { href: "/in-flight", label: "In-Flight" },
];

const socialLinks = [
  { href: "https://www.instagram.com/latest_talks/", icon: SiInstagram, label: "Instagram" },
  { href: "https://www.linkedin.com/company/latesttalks", icon: SiLinkedin, label: "LinkedIn" },
  { href: "https://t.me/Latest_Talks", icon: SiTelegram, label: "Telegram" },
  { href: "https://www.youtube.com/c/LatestTalks", icon: SiYoutube, label: "YouTube" },
  { href: "https://x.com/latest_talks", icon: SiX, label: "X" },
];

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="bg-secondary text-secondary-foreground fixed top-0 left-0 right-0 z-[100] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-2 md:gap-4">
          <Link href="/" className="flex items-center flex-shrink-0" data-testid="link-home-logo">
            <img 
              src={logoUrl} 
              alt="Latest Talks" 
              className="h-10 w-auto"
              data-testid="img-logo"
            />
          </Link>

          {/* Desktop nav - only show on xl and up */}
          <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center min-w-0" data-testid="nav-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className={`px-3 py-2 text-sm font-medium transition-all duration-200 hover:text-primary whitespace-nowrap ${
                  location === link.href ? "text-primary" : ""
                }`}>
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {searchOpen ? (
              <div className="hidden md:flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Search episodes..."
                  className="w-40 h-8 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50"
                  data-testid="input-search"
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setSearchOpen(false)}
                  className="text-secondary-foreground hover:bg-secondary-foreground/10"
                  data-testid="button-close-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setSearchOpen(true)}
                className="text-secondary-foreground hover:bg-secondary-foreground/10"
                data-testid="button-open-search"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            <Link href="/plus" data-testid="link-plus">
              <Button className="hidden sm:flex btn-gradient gap-1.5 text-sm px-3 glow-red-hover hover:-translate-y-[1px] transition-all duration-200">
                <Crown className="h-4 w-4" />
                <span className="hidden md:inline">Latest Talks+</span>
              </Button>
            </Link>

            {/* Social links - only show on very large screens */}
            <div className="hidden 3xl:flex items-center gap-0.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-secondary-foreground/70 hover:text-primary transition-colors"
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Mobile menu button - show on screens smaller than xl */}
            <Button
              size="icon"
              variant="ghost"
              className="xl:hidden text-secondary-foreground hover:bg-secondary-foreground/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-secondary border-t border-secondary-foreground/10" data-testid="nav-mobile">
          <div className="px-4 py-4 space-y-1">
            <Input
              type="search"
              placeholder="Search episodes..."
              className="w-full mb-4 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50"
              data-testid="input-search-mobile"
            />
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-nav-mobile-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className={`block px-3 py-2.5 text-sm font-medium transition-colors hover:text-primary hover:bg-secondary-foreground/5 rounded ${
                    location === link.href ? "text-primary bg-primary/10" : ""
                  }`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-secondary-foreground/10 mt-4">
              <Link
                href="/plus"
                onClick={() => setMobileMenuOpen(false)}
                className="sm:hidden"
                data-testid="link-plus-mobile"
              >
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded font-medium">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm">Latest Talks+</span>
                </div>
              </Link>
              <div className="flex items-center justify-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 text-secondary-foreground/70 hover:text-primary hover:bg-secondary-foreground/5 rounded transition-colors"
                    data-testid={`link-social-mobile-${social.label.toLowerCase()}`}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
