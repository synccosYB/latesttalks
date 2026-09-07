import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Building2, Globe, Mail, Phone, Tag, ArrowLeft, Calendar, Play, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Sponsor, Episode } from "@shared/schema";

interface EpisodeSponsor {
  id: string;
  episodeId: number;
  sponsorId: string;
  slotNumber: number | null;
  episode: Episode;
}

export default function SponsorPage() {
  const { id } = useParams<{ id: string }>();

  const { data: sponsor, isLoading: sponsorLoading } = useQuery<Sponsor>({
    queryKey: ["/api/sponsors", id],
  });

  const { data: sponsoredEpisodes, isLoading: episodesLoading } = useQuery<EpisodeSponsor[]>({
    queryKey: ["/api/sponsors", id, "episodes"],
    enabled: !!id,
  });

  const isLoading = sponsorLoading || episodesLoading;

  useEffect(() => {
    if (sponsor) {
      document.title = `${sponsor.name} - Sponsor | Latest Talks`;
      const metaDescription = document.querySelector('meta[name="description"]');
      const description = `${sponsor.name} is a proud sponsor of Latest Talks, the biggest Jewish network in Yiddish. View their sponsored episodes and exclusive promo codes.`;
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = description;
        document.head.appendChild(meta);
      }
      
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute("content", `${sponsor.name} - Sponsor | Latest Talks`);
      }
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute("content", description);
      }
    }
    
    return () => {
      document.title = "Latest Talks - The Biggest Jewish Network in Yiddish";
    };
  }, [sponsor]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <main className="py-12">
          <div className="max-w-4xl mx-auto px-4">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64 w-full mb-8" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <main className="py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-4">Sponsor Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This sponsor doesn't exist or has been removed.
            </p>
            <Link href="/sponsors">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sponsors
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const publishedEpisodes = sponsoredEpisodes?.filter(es => es.episode.status === "published") || [];

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/sponsors" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Sponsors
          </Link>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {sponsor.logoUrl ? (
                  <div className="flex-shrink-0">
                    <img 
                      src={sponsor.logoUrl} 
                      alt={sponsor.name}
                      className="w-32 h-32 object-contain rounded-lg bg-white border p-3"
                      data-testid="img-sponsor-logo"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold" data-testid="text-sponsor-name">{sponsor.name}</h1>
                    <Badge variant={sponsor.contractStatus === "active" ? "default" : "secondary"}>
                      {sponsor.contractStatus === "active" ? "Active Sponsor" : sponsor.contractStatus}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-muted-foreground">
                    {sponsor.website && (
                      <a 
                        href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        data-testid="link-sponsor-website"
                      >
                        <Globe className="h-4 w-4" />
                        <span>{sponsor.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {(sponsor.companyPhone || sponsor.contactPhone) && (
                      <a 
                        href={`tel:${sponsor.companyPhone || sponsor.contactPhone}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        data-testid="link-sponsor-phone"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{sponsor.companyPhone || sponsor.contactPhone}</span>
                      </a>
                    )}
                    {(sponsor.companyEmail || sponsor.contactEmail) && (
                      <a 
                        href={`mailto:${sponsor.companyEmail || sponsor.contactEmail}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        data-testid="link-sponsor-email"
                      >
                        <Mail className="h-4 w-4" />
                        <span>{sponsor.companyEmail || sponsor.contactEmail}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {sponsor.promoCode && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Tag className="h-5 w-5" />
                    <span className="font-medium">Promo Code:</span>
                    <code className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded font-mono text-lg">{sponsor.promoCode}</code>
                  </div>
                  <p className="mt-2 text-sm text-green-600 dark:text-green-500">
                    {sponsor.promoMemo ? `Mention this code to get: ${sponsor.promoMemo}` : "Mention this code to get the promotion"}
                  </p>
                  {sponsor.promoLink && (
                    <a 
                      href={sponsor.promoLink.startsWith("http") ? sponsor.promoLink : `https://${sponsor.promoLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 dark:text-green-500"
                    >
                      Use this code at {sponsor.promoLink.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Sponsored Episodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {publishedEpisodes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No published episodes sponsored by {sponsor.name} yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {publishedEpisodes.map((es) => (
                    <Link 
                      key={es.id} 
                      href={`/episode/${es.episode.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group">
                        {es.episode.thumbnailUrl ? (
                          <img 
                            src={es.episode.thumbnailUrl}
                            alt={es.episode.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                            <Play className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium group-hover:text-primary transition-colors truncate" data-testid={`text-episode-title-${es.episode.id}`}>
                            {es.episode.episodeNumber && `#${es.episode.episodeNumber} - `}{es.episode.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {es.episode.publishedAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(es.episode.publishedAt).toLocaleDateString()}
                              </span>
                            )}
                            {es.slotNumber && (
                              <Badge variant="outline" className="text-xs">
                                Slot {es.slotNumber}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link href="/ads">
              <Button variant="outline">
                Interested in Sponsoring?
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
