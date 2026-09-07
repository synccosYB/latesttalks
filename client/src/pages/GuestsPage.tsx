import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Mail, Globe, Building2, Star, ChevronRight, Search, ArrowDownAZ, Clock } from "lucide-react";
import { SiInstagram, SiLinkedin, SiTelegram, SiYoutube, SiX } from "react-icons/si";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Guest, Episode } from "@shared/schema";
import { stripHtmlToText } from "@shared/textUtils";

const socialIcons: Record<string, typeof SiInstagram> = {
  instagram: SiInstagram,
  linkedin: SiLinkedin,
  telegram: SiTelegram,
  youtube: SiYoutube,
  x: SiX,
  twitter: SiX,
};

export default function GuestsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "az">("recent");

  const { data: guests, isLoading } = useQuery<Guest[]>({
    queryKey: ["/api/guests"],
  });

  const { data: episodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const publishedGuests = guests?.filter(g => g.status === "published" || !g.status) || [];
  
  const guestLatestEpisodeDate = useMemo(() => {
    const dateMap: Record<string, Date> = {};
    if (episodes) {
      const publishedEpisodes = episodes.filter(e => e.status === "published");
      publishedEpisodes.forEach(ep => {
        const epDate = ep.createdAt ? new Date(ep.createdAt) : new Date(0);
        const guestIds = [ep.guestId, ep.guest2Id, ep.guest3Id].filter(Boolean) as string[];
        guestIds.forEach(gId => {
          if (!dateMap[gId] || epDate > dateMap[gId]) {
            dateMap[gId] = epDate;
          }
        });
      });
    }
    return dateMap;
  }, [episodes]);
  
  const filteredAndSortedGuests = useMemo(() => {
    let result = publishedGuests;
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(g => 
        g.name.toLowerCase().includes(searchLower) ||
        g.namePrefix?.toLowerCase().includes(searchLower) ||
        g.title?.toLowerCase().includes(searchLower) ||
        g.company?.toLowerCase().includes(searchLower)
      );
    }
    
    if (sortBy === "az") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result = [...result].sort((a, b) => {
        const dateA = guestLatestEpisodeDate[a.id]?.getTime() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = guestLatestEpisodeDate[b.id]?.getTime() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA;
      });
    }
    
    return result;
  }, [publishedGuests, search, sortBy, guestLatestEpisodeDate]);

  const featuredGuests = filteredAndSortedGuests.filter(g => g.featured);
  const otherGuests = filteredAndSortedGuests.filter(g => !g.featured);

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-4" data-testid="text-page-title">
            Meet the Guests
          </h1>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Fascinating individuals who have shared their stories, insights, and expertise 
            on Latest Talks - the biggest Jewish network in Yiddish.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-guest-search"
              />
            </div>
            <Button
              variant={sortBy === "az" ? "default" : "outline"}
              onClick={() => setSortBy(sortBy === "az" ? "recent" : "az")}
              className="gap-2"
              data-testid="button-sort-toggle"
            >
              {sortBy === "az" ? (
                <>
                  <ArrowDownAZ className="h-4 w-4" />
                  A-Z
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Recent
                </>
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {featuredGuests.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <Star className="h-5 w-5 text-primary fill-primary" />
                    <h2 className="text-xl font-semibold">Featured Guests</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {featuredGuests.map((guest) => (
                      <GuestCard key={guest.id} guest={guest} />
                    ))}
                  </div>
                </section>
              )}

              {otherGuests.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-6">All Guests</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {otherGuests.map((guest) => (
                      <GuestCard key={guest.id} guest={guest} />
                    ))}
                  </div>
                </section>
              )}

              {filteredAndSortedGuests.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {search ? `No guests found matching "${search}"` : "No guests found."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function GuestCard({ guest }: { guest: Guest }) {
  return (
    <Link href={`/guest/${guest.id}`}>
      <Card className="hover-elevate transition-all cursor-pointer group h-[140px]" data-testid={`card-guest-${guest.id}`}>
        <CardContent className="p-6 h-full">
          <div className="flex gap-4 h-full">
            <Avatar className="w-20 h-20 flex-shrink-0">
              <AvatarImage src={guest.imageUrl || undefined} alt={guest.name} />
              <AvatarFallback className="text-xl bg-secondary text-secondary-foreground">
                {guest.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors" data-testid={`text-guest-name-${guest.id}`}>
                  {guest.namePrefix && `${guest.namePrefix} `}{guest.name}
                </h3>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
              <p className="text-primary font-medium text-sm truncate min-h-[1.25rem]">
                {guest.title || guest.company ? (
                  <>
                    {guest.title}
                    {guest.title && guest.company && " at "}
                    {guest.company}
                  </>
                ) : (
                  <span className="text-muted-foreground">Featured guest on Latest Talks</span>
                )}
              </p>
              <p className="text-muted-foreground text-sm line-clamp-1 mt-auto">
                {stripHtmlToText(guest.bio) || "Featured guest on Latest Talks."}
                {" "}Appeared in {guest.featured ? "multiple episodes" : "1 episode"}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
