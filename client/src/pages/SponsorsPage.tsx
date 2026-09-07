import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Building2, Globe, Mail, Phone, ExternalLink, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Sponsor } from "@shared/schema";

export default function SponsorsPage() {
  const { data: sponsors, isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const activeSponsors = sponsors?.filter(s => s.contractStatus === "active") || [];

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      
      <main className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" data-testid="text-page-title">Our Sponsors</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These amazing partners make Latest Talks possible. Click on any sponsor to learn more about them and see the episodes they've supported.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : activeSponsors.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No sponsors yet</h2>
              <p className="text-muted-foreground">
                Interested in sponsoring? <Link href="/ads" className="text-primary hover:underline">Learn more</Link>
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeSponsors.map((sponsor) => (
                <Link 
                  key={sponsor.id} 
                  href={`/sponsor/${sponsor.id}`}
                  data-testid={`link-sponsor-${sponsor.id}`}
                >
                  <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer group flex flex-col">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors flex items-center gap-2" data-testid={`text-sponsor-name-${sponsor.id}`}>
                              {sponsor.name}
                              <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                            <Badge variant="outline" className="mt-1">
                              Active Sponsor
                            </Badge>
                          </div>
                        </div>
                        {sponsor.logoUrl && (
                          <div className="flex-shrink-0">
                            <img 
                              src={sponsor.logoUrl} 
                              alt={sponsor.name}
                              className="w-16 h-16 object-contain rounded-lg bg-white border p-2"
                              data-testid={`img-sponsor-logo-${sponsor.id}`}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 space-y-0.5 text-xs text-muted-foreground min-h-[44px]">
                        {sponsor.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{sponsor.website.replace(/^https?:\/\//, '')}</span>
                          </div>
                        )}
                        {(sponsor.companyPhone || sponsor.contactPhone) && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{sponsor.companyPhone || sponsor.contactPhone}</span>
                          </div>
                        )}
                        {(sponsor.companyEmail || sponsor.contactEmail) && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{sponsor.companyEmail || sponsor.contactEmail}</span>
                          </div>
                        )}
                      </div>

                      <div className="min-h-[32px]">
                        {sponsor.promoCode && (
                          <div className="mt-2 p-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                              <Tag className="h-4 w-4 flex-shrink-0" />
                              <span>Promo Code: <code className="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded font-mono">{sponsor.promoCode}</code></span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-auto pt-3 border-t">
                        <span className="text-xs text-primary font-medium group-hover:underline">
                          View sponsored episodes →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Want to Become a Sponsor?</h2>
                <p className="text-muted-foreground mb-6">
                  Join our growing list of sponsors and reach thousands of engaged listeners in the Yiddish community.
                </p>
                <Link href="/ads">
                  <button className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors" data-testid="button-become-sponsor">
                    Learn About Sponsorship
                  </button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
