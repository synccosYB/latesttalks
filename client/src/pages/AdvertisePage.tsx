import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Megaphone, CheckCircle, X, ExternalLink, Calendar, Users, Sparkles, Clock, Star, Building2, Tag, Search, ShieldCheck } from "lucide-react";
import PaymentLogos from "@/components/PaymentLogos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sponsor, Episode } from "@shared/schema";
import { stripHtmlToText } from "@shared/textUtils";

const adSlots = [
  { type: "prime-time", name: "Prime Time", price: 2500, slots: [1, 2] },
  { type: "ad-break-1", name: "Ad Break 1", price: 1500, slots: [1, 2] },
  { type: "ad-break-2", name: "Ad Break 2", price: 1000, slots: [1, 2] },
];

function SponsorLogo({ sponsor }: { sponsor: Sponsor }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <a
      href={sponsor.website || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="opacity-90 hover:opacity-100 transition-all duration-300 flex items-center justify-center h-16 px-2"
      data-testid={`logo-sponsor-${sponsor.id}`}
      title={sponsor.name}
    >
      {imageError ? (
        <span className="text-sm font-medium text-foreground">{sponsor.name}</span>
      ) : (
        <img 
          src={sponsor.logoUrl!} 
          alt={sponsor.name}
          className="max-h-12 max-w-[140px] object-contain drop-shadow-sm grayscale hover:grayscale-0 transition-all duration-300"
          onError={() => setImageError(true)}
        />
      )}
    </a>
  );
}

interface SlotSelection {
  slotType: string;
  slotNumber: number;
  slotName: string;
  price: number;
}

export default function AdvertisePage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    numberOfEpisodes: "1",
    message: "",
  });

  const { data: sponsors, isLoading: isSponsorsLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const { data: upcomingEpisodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes?status=scheduled"],
  });

  const sponsorsWithLogos = useMemo(() => {
    return sponsors?.filter(s => s.logoUrl && s.isFeatured) || [];
  }, [sponsors]);

  const activePromotions = useMemo(() => {
    return sponsors?.filter(s => s.promoCode && s.contractStatus === "active") || [];
  }, [sponsors]);

  const filteredSponsors = useMemo(() => {
    if (!searchQuery.trim()) return sponsors || [];
    const query = searchQuery.toLowerCase();
    return (sponsors || []).filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.promoCode?.toLowerCase().includes(query) ||
      s.website?.toLowerCase().includes(query)
    );
  }, [sponsors, searchQuery]);

  const submitSlotRequest = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) return;
      return apiRequest("POST", "/api/ad-slot-requests", {
        companyName: formData.companyName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone || null,
        slotType: selectedSlot.slotType,
        slotNumber: selectedSlot.slotNumber,
        numberOfEpisodes: parseInt(formData.numberOfEpisodes) || 1,
        pricePerEpisode: selectedSlot.price,
        message: formData.message || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Request submitted!",
        description: "We'll be in touch soon to discuss your ad slot request.",
      });
      setDialogOpen(false);
      setSelectedSlot(null);
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        numberOfEpisodes: "1",
        message: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSlotClick = (slotType: string, slotNumber: number, slotName: string, price: number) => {
    setSelectedSlot({ slotType, slotNumber, slotName, price });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSlotRequest.mutate();
  };

  const totalCost = selectedSlot 
    ? selectedSlot.price * (parseInt(formData.numberOfEpisodes) || 1) 
    : 0;

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4" data-testid="text-page-title">
              Advertise With Us
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Partner with the biggest Jewish network in Yiddish. Reach an engaged audience 
              of thousands through our podcast, video content, and website.
            </p>
          </div>

          {/* How Ads Work - Animated Timeline */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold italic mb-2" data-testid="text-how-ads-work">How Ads Work</h2>
              <p className="text-muted-foreground text-sm">Click on any slot to request it</p>
            </div>
            
            <div className="relative max-w-4xl mx-auto">
              {/* Timeline Track */}
              <div className="relative pt-4 pb-8">
                {/* Ad Break Cards with Dots Below */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {adSlots.map((adSlot, index) => (
                    <div key={adSlot.type} className="flex flex-col items-center">
                      <div 
                        className="w-full bg-secondary rounded-lg p-4 text-secondary-foreground transform hover:scale-105 transition-all duration-300 animate-fade-in-up border-2 border-secondary-foreground/20"
                        style={{ animationDelay: `${0.1 + index * 0.2}s` }}
                      >
                        <div className="text-center mb-3">
                          <p className="font-bold text-sm md:text-base">{adSlot.name}</p>
                          <p className="text-lg md:text-xl font-bold">${adSlot.price.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                          {adSlot.slots.map((slotNum) => (
                            <button
                              key={slotNum}
                              onClick={() => handleSlotClick(adSlot.type, slotNum, adSlot.name, adSlot.price)}
                              className="w-full bg-primary/20 text-secondary-foreground border border-secondary-foreground/30 rounded py-2 px-3 text-center text-sm font-medium hover:bg-primary/30 hover:scale-[1.02] transition-all cursor-pointer"
                              data-testid={`button-slot-${adSlot.type}-${slotNum}`}
                            >
                              Slot {slotNum}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Timeline Line */}
                <div className="relative mt-6 mx-4">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-secondary via-secondary to-muted-foreground/40 rounded-full" />
                  
                  {/* Dots positioned below each section */}
                  <div className="relative flex justify-between items-center">
                    {/* Start Dot - before Prime Time */}
                    <div className="relative z-10 w-4 h-4 bg-secondary rounded-full border-4 border-background shadow-lg animate-pulse" />
                    
                    {/* Prime Time Dot - below first card */}
                    <div className="relative z-10 w-4 h-4 bg-secondary rounded-full border-4 border-background shadow-lg" style={{ marginLeft: 'calc(16.67% - 8px)' }} />
                    
                    {/* Ad Break 1 Dot - below second card */}
                    <div className="relative z-10 w-4 h-4 bg-secondary rounded-full border-4 border-background shadow-lg" />
                    
                    {/* Ad Break 2 Dot - below third card */}
                    <div className="relative z-10 w-4 h-4 bg-secondary rounded-full border-4 border-background shadow-lg" />
                    
                    {/* End Dot - content continues after last ad */}
                    <div className="relative z-10 w-4 h-4 bg-muted-foreground/50 rounded-full border-4 border-background shadow-lg" />
                  </div>
                </div>
                
                {/* Time Labels */}
                <div className="flex justify-between mx-4 mt-3 text-sm text-muted-foreground">
                  <span>Start</span>
                  <span className="text-center" style={{ marginLeft: 'calc(25% - 20px)' }}>30:00</span>
                  <span className="text-center">1:00:00</span>
                  <span>End</span>
                </div>
              </div>
              
              {/* Info Notes */}
              <div className="mt-8 space-y-2 text-sm text-muted-foreground italic max-w-xl">
                <p>- Ads are limited to only 6 slots per episode.</p>
                <p>- Each ad slot video length is up to 30 seconds.</p>
                <p>- Video ad size is 1920 pixels in width and 1080 pixels in height.</p>
              </div>
            </div>
          </div>

          {/* Upcoming Episodes Section */}
          {upcomingEpisodes && upcomingEpisodes.length > 0 && (
            <div className="mb-16">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold" data-testid="text-upcoming-episodes">Upcoming Episodes</h2>
                </div>
                <p className="text-muted-foreground">
                  Secure your ad slot in these exciting upcoming episodes
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEpisodes.slice(0, 6).map((episode) => (
                  <Card 
                    key={episode.id} 
                    className="overflow-hidden hover-elevate"
                    data-testid={`card-upcoming-${episode.id}`}
                  >
                    <div className="relative aspect-video bg-secondary">
                      {episode.youtubeId ? (
                        <img
                          src={`https://img.youtube.com/vi/${episode.youtubeId}/mqdefault.jpg`}
                          alt={episode.title}
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground gap-1">
                        <Sparkles className="h-3 w-3" />
                        Coming Soon
                      </Badge>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-bold text-white text-lg line-clamp-2">
                          {episode.episodeNumber ? `Ep. ${episode.episodeNumber}` : ""}{" "}
                          {episode.guestName || episode.title}
                        </h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        {episode.scheduledAt && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {new Date(episode.scheduledAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </div>
                        )}
                        {episode.category && (
                          <Badge variant="outline" className="text-xs">
                            {episode.category}
                          </Badge>
                        )}
                      </div>
                      {episode.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {stripHtmlToText(episode.description)}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>Ad slots available</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleSlotClick("prime-time", 1, "Prime Time", 2500)}
                          data-testid={`button-sponsor-${episode.id}`}
                        >
                          Sponsor This
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {upcomingEpisodes.length === 0 && (
                <Card className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">New Episodes Coming Soon</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    We're always working on exciting new content. Contact us to discuss sponsorship for upcoming episodes.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const form = document.getElementById('gen-companyName');
                      form?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Inquire About Upcoming Episodes
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Our Advertisers - Sponsor Logos */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-trusted-by">Our Advertisers</h2>
            </div>
            {isSponsorsLoading ? (
              <div className="flex flex-wrap justify-center items-center gap-8 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-32 rounded" />
                ))}
              </div>
            ) : sponsorsWithLogos.length > 0 ? (
              <div className="flex flex-wrap justify-center items-center gap-8 py-4">
                {sponsorsWithLogos.map((sponsor) => (
                  <SponsorLogo key={sponsor.id} sponsor={sponsor} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Sponsor logos will appear here</p>
                <p className="text-xs mt-1">Upload logos in the admin panel to display them</p>
              </div>
            )}
          </div>

          {/* Advertiser Search */}
          <div className="mb-8">
            <div className="relative max-w-sm mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search advertisers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-advertisers"
              />
            </div>
          </div>

          {/* Active Promotions */}
          {activePromotions.length > 0 && (
            <div className="mb-16">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Tag className="h-6 w-6 text-green-600" />
                  <h2 className="text-2xl font-bold" data-testid="text-active-promotions">Active Promotions</h2>
                </div>
                <p className="text-muted-foreground">Current sponsor deals and promo codes</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePromotions.map((sponsor) => (
                  <Link key={sponsor.id} href={`/sponsor/${sponsor.id}`}>
                    <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-promo-${sponsor.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {sponsor.logoUrl ? (
                            <img 
                              src={sponsor.logoUrl} 
                              alt={sponsor.name}
                              className="w-12 h-12 object-contain rounded bg-white border p-1 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{sponsor.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-sm font-mono font-semibold">
                                {sponsor.promoCode}
                              </code>
                            </div>
                            {sponsor.promoMemo && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{sponsor.promoMemo}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Sponsors */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {searchQuery ? `Search Results (${filteredSponsors.length})` : "Our Sponsors"}
                  </CardTitle>
                  <CardDescription>
                    {searchQuery 
                      ? `Showing results for "${searchQuery}"`
                      : "Join these great companies who partner with Latest Talks"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(searchQuery ? filteredSponsors : sponsors?.slice(0, 3) || []).map((sponsor) => (
                      <Link 
                        key={sponsor.id}
                        href={`/sponsor/${sponsor.id}`}
                        className="flex items-center gap-3 p-3 bg-muted rounded-lg hover-elevate cursor-pointer"
                        data-testid={`sponsor-${sponsor.id}`}
                      >
                        {sponsor.logoUrl ? (
                          <img src={sponsor.logoUrl} alt="" className="w-8 h-8 object-contain rounded" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                        <span className="font-medium flex-1">{sponsor.name}</span>
                        {sponsor.promoCode && (
                          <code className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs font-mono">
                            {sponsor.promoCode}
                          </code>
                        )}
                      </Link>
                    ))}
                    
                    {searchQuery && filteredSponsors.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No advertisers found matching "{searchQuery}"</p>
                      </div>
                    )}
                    
                    {!searchQuery && sponsors && sponsors.length > 3 && (
                      <Link href="/sponsors" className="block mt-4">
                        <Button variant="outline" className="w-full" data-testid="link-view-all-sponsors">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View All Sponsors ({sponsors.length})
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* General Inquiry Form */}
            <Card>
              <CardHeader>
                <CardTitle>General Inquiry</CardTitle>
                <CardDescription>
                  Have questions or want a custom package? Fill out this form or click on a specific slot above.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // For general inquiries, use sponsor-inquiries endpoint
                  apiRequest("POST", "/api/sponsor-inquiries", {
                    companyName: formData.companyName,
                    contactName: formData.contactName,
                    email: formData.email,
                    phone: formData.phone,
                    budget: "",
                    message: formData.message,
                  }).then(() => {
                    toast({
                      title: "Inquiry submitted!",
                      description: "We'll be in touch soon to discuss partnership opportunities.",
                    });
                    setFormData({
                      companyName: "",
                      contactName: "",
                      email: "",
                      phone: "",
                      numberOfEpisodes: "1",
                      message: "",
                    });
                  }).catch(() => {
                    toast({
                      title: "Error",
                      description: "Failed to submit inquiry. Please try again.",
                      variant: "destructive",
                    });
                  });
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gen-companyName">Company Name</Label>
                    <Input
                      id="gen-companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      data-testid="input-gen-company-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gen-contactName">Contact Name</Label>
                    <Input
                      id="gen-contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      required
                      data-testid="input-gen-contact-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gen-email">Email</Label>
                    <Input
                      id="gen-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="input-gen-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gen-phone">Phone (optional)</Label>
                    <Input
                      id="gen-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="input-gen-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gen-message">Message</Label>
                    <Textarea
                      id="gen-message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your business and what you're looking for..."
                      className="min-h-24 resize-none"
                      data-testid="input-gen-message"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    data-testid="button-gen-submit"
                  >
                    Submit Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* What You Get - Full Width Below Form */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-lg">What You Get</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Dedicated sponsor mention in episodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Logo placement in video and description</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Promo code for tracking conversions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">View analytics and milestone reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Featured on our website sponsor page</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div className="mt-10 flex flex-col items-center gap-3" data-testid="ad-payment-logos">
            <PaymentLogos size="lg" />
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Prefer to reach out directly? Email us at{" "}
              <a href="mailto:Ads@LatestTalks.com" className="text-primary hover:underline" data-testid="link-email">
                Ads@LatestTalks.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Ad Slot Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Ad Slot</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  <span className="font-semibold text-foreground">{selectedSlot.slotName} - Slot {selectedSlot.slotNumber}</span>
                  <span className="ml-2">(${selectedSlot.price.toLocaleString()} per episode)</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                required
                data-testid="input-contact-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEpisodes">Number of Episodes *</Label>
              <Select 
                value={formData.numberOfEpisodes} 
                onValueChange={(value) => setFormData({ ...formData, numberOfEpisodes: value })}
              >
                <SelectTrigger data-testid="select-episodes">
                  <SelectValue placeholder="Select number of episodes" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} episode{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Custom Requests / Comments (optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Any special requirements, custom package requests, or questions..."
                className="min-h-20 resize-none"
                data-testid="input-message"
              />
            </div>
            
            {/* Total Cost Display */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated Total:</span>
                <span className="text-xl font-bold text-primary">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.numberOfEpisodes} episode{parseInt(formData.numberOfEpisodes) > 1 ? 's' : ''} × ${selectedSlot?.price.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={submitSlotRequest.isPending}
                data-testid="button-submit"
              >
                {submitSlotRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
