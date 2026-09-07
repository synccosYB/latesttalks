import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Mail, Globe, Building2, Phone, ArrowLeft, Calendar, Play } from "lucide-react";
import { SiInstagram, SiLinkedin, SiTelegram, SiYoutube, SiX } from "react-icons/si";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RichTextContent from "@/components/RichTextContent";
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

export default function GuestPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: guest, isLoading } = useQuery<Guest>({
    queryKey: ["/api/guests", id],
    enabled: !!id,
  });

  const { data: episodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const guestEpisodes = guest ? (episodes?.filter(ep => 
    ep.guestId === guest.id ||
    ep.guest2Id === guest.id ||
    ep.guest3Id === guest.id ||
    ep.guestName?.toLowerCase().includes(guest.name.toLowerCase()) ||
    ep.guest2Name?.toLowerCase().includes(guest.name.toLowerCase()) ||
    ep.guest3Name?.toLowerCase().includes(guest.name.toLowerCase()) ||
    guest.episodeIds?.includes(ep.id)
  ) || []) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <main className="py-12">
          <div className="max-w-4xl mx-auto px-4">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="w-48 h-48 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-10 w-64 mb-4" />
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <main className="py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Guest Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The guest you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/guests">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Guests
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/guests" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to All Guests
          </Link>

          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="flex-shrink-0 flex flex-col items-center md:items-start">
              <Avatar className="w-48 h-48 mb-4">
                <AvatarImage 
                  src={guest.imageUrl || guestEpisodes[0]?.thumbnailUrl || (guestEpisodes[0]?.youtubeId ? `https://img.youtube.com/vi/${guestEpisodes[0].youtubeId}/hqdefault.jpg` : undefined)} 
                  alt={guest.name} 
                  className="object-cover" 
                />
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                  {guest.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {guest.featured && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Featured Guest
                </Badge>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-guest-name">
                {guest.namePrefix && `${guest.namePrefix} `}{guest.name}
              </h1>
              
              {(guest.title || guest.company) && (
                <p className="text-xl text-primary font-medium mb-2">
                  {guest.title}
                  {guest.title && guest.company && guest.title.length > 5 && !guest.title.match(/^(R'|Rabbi|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Rev\.?|Fr\.?|Sr\.?|Jr\.?)$/i) && " at "}
                  {guest.title && guest.company && (guest.title.length <= 5 || guest.title.match(/^(R'|Rabbi|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Rev\.?|Fr\.?|Sr\.?|Jr\.?)$/i)) && " • "}
                  {guest.company}
                </p>
              )}

              <p className="text-muted-foreground mb-4" data-testid="text-guest-episode-count">
                Featured guest on Latest Talks.{" "}
                {guestEpisodes.length > 0 
                  ? `Appeared in ${guestEpisodes.length} episode${guestEpisodes.length !== 1 ? "s" : ""}.`
                  : ""}
              </p>

              {guest.bio && !stripHtmlToText(guest.bio).toLowerCase().includes("featured guest on latest talks") && (
                <RichTextContent
                  html={guest.bio}
                  className="text-muted-foreground text-lg leading-relaxed mb-6"
                  data-testid="text-guest-bio"
                />
              )}

              <div className="flex flex-wrap items-center gap-4">
                {guest.company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-5 w-5" />
                    <span>{guest.company}</span>
                  </div>
                )}
                {guest.email && (
                  <a 
                    href={`mailto:${guest.email}`} 
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-guest-email"
                  >
                    <Mail className="h-5 w-5" />
                    <span>{guest.email}</span>
                  </a>
                )}
                {guest.phone && (
                  <a 
                    href={`tel:${guest.phone}`} 
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-guest-phone"
                  >
                    <Phone className="h-5 w-5" />
                    <span>{guest.phone}</span>
                  </a>
                )}
                {guest.website && (
                  <a 
                    href={guest.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-guest-website"
                  >
                    <Globe className="h-5 w-5" />
                    <span>Website</span>
                  </a>
                )}
              </div>

              {guest.socialLinks && guest.socialLinks.length > 0 && (
                <div className="flex items-center gap-3 mt-6">
                  {guest.socialLinks.map((social) => {
                    const Icon = socialIcons[social.platform.toLowerCase()] || SiInstagram;
                    return (
                      <a
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        data-testid={`link-guest-social-${social.platform}`}
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {guestEpisodes.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Episodes with {guest.name}</h2>
              <div className="grid gap-4">
                {guestEpisodes.map((episode) => (
                  <Link key={episode.id} href={`/episode/${episode.id}`}>
                    <Card className="hover-elevate transition-all cursor-pointer" data-testid={`card-episode-${episode.id}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {(episode.thumbnailUrl || episode.youtubeId) && (
                            <img 
                              src={episode.thumbnailUrl || `https://i.ytimg.com/vi/${episode.youtubeId}/mqdefault.jpg`} 
                              alt={episode.title}
                              className="w-32 h-20 object-cover rounded-md flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {episode.episodeNumber && (
                                <Badge variant="outline" className="flex-shrink-0">
                                  #{episode.episodeNumber}
                                </Badge>
                              )}
                              <h3 className="font-semibold truncate">{episode.title}</h3>
                            </div>
                            {episode.publishedAt && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <Calendar className="h-3 w-3" />
                                {new Date(episode.publishedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            )}
                            {episode.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {stripHtmlToText(episode.description)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                              <Play className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
