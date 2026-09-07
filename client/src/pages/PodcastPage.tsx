import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Play, Headphones, Crown, Sparkles, Radio, ChevronDown, Podcast, TrendingUp, Star, Music } from "lucide-react";
import { SiSpotify, SiApplepodcasts, SiYoutube } from "react-icons/si";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedVideo from "@/components/ProtectedVideo";
import { Link } from "wouter";
import type { Episode } from "@shared/schema";
import yiddish24Logo from "@assets/400x400ia-75_1765316187929.webp";
import zingMusicLogo from "@assets/Zing_Music_Apple_1766532262253.webp";

const Yiddish24Icon = ({ className }: { className?: string }) => (
  <img src={yiddish24Logo} alt="Yiddish24" className={`h-5 w-5 rounded-sm object-contain ${className || ''}`} />
);

const ZingMusicIcon = ({ className }: { className?: string }) => (
  <img src={zingMusicLogo} alt="Zing Music" className={`h-5 w-5 rounded object-contain ${className || ''}`} />
);

type EpisodeWithLabels = Episode & { computedLabel?: string | null; recentViews?: number; hasPrimeSponsor?: boolean };

const mainPlatforms = [
  { name: "Apple Podcasts", icon: SiApplepodcasts, url: "https://podcasts.apple.com/at/podcast/latest-talks/id1562182641", color: "bg-purple-600" },
  { name: "Spotify", icon: SiSpotify, url: "https://open.spotify.com/show/24ep0wnTNCbSHTOZTEeY8F", color: "bg-green-600" },
  { name: "YouTube", icon: SiYoutube, url: "https://www.youtube.com/c/LatestTalks", color: "bg-red-600" },
  { name: "Yiddish24", icon: Yiddish24Icon, url: "https://www.yiddish24.com/cat/196", color: "bg-[#6B7A9A]" },
  { name: "Zing Music", icon: ZingMusicIcon, url: "https://zingmusic.app/?rssId=9629&title=Latest%20Talks", color: "bg-violet-900" },
];

const morePlatforms = [
  { name: "Podbean", icon: Podcast, url: "https://www.podbean.com/podcast-detail/bz3c7-1b4e7b/Latest-Talks-Podcast", color: "bg-orange-500" },
  { name: "KosherTube", icon: Radio, url: "https://koshertube.co.uk/latest-talks/", color: "bg-blue-600" },
  { name: "AhBlick Live", icon: Headphones, url: "https://ahblicklive.com/archives.php?tag=%D7%9C%D7%A2%D7%99%D7%98%D7%A2%D7%A1%D7%98%20%D7%98%D7%90%D7%90%D7%A7%D7%A1&allowed_categories=2", color: "bg-teal-600" },
];

const categories = [
  { id: "all", label: "All Posts" },
  { id: "podcast", label: "Podcast" },
  { id: "live-podcast", label: "Live Podcast" },
  { id: "music-interviews", label: "Music Interviews" },
  { id: "seasonal", label: "Seasonal Projects" },
  { id: "latest-talks-plus", label: "Latest Talks+" },
];

function EpisodePodcastCard({ episode, onListen }: { episode: EpisodeWithLabels; onListen: (episode: EpisodeWithLabels) => void }) {
  const thumbnailUrl = episode.youtubeId 
    ? `https://img.youtube.com/vi/${episode.youtubeId}/mqdefault.jpg`
    : "/placeholder-episode.jpg";

  const handleListenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onListen(episode);
  };

  const isPremiumOnly = episode.isPremium && !episode.isPremiumReleased;
  const isPremiumReleased = episode.isPremium && episode.isPremiumReleased;

  const hasPrime = (episode as EpisodeWithLabels).hasPrimeSponsor;
  
  return (
    <Card className={`group overflow-hidden hover-elevate h-full ${hasPrime ? 'ring-2 ring-amber-400' : ''}`} data-testid={`card-episode-${episode.id}`}>
      <Link href={`/episode/${episode.id}`}>
        <div className="relative aspect-video overflow-hidden cursor-pointer">
          <img
            src={thumbnailUrl}
            alt={episode.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-2 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm" />
              <div className="relative w-16 h-11 rounded-xl bg-[#FF0000]/90 flex items-center justify-center group-hover:bg-[#FF0000] group-hover:scale-110 transition-all duration-200 shadow-lg ring-2 ring-white/30 group-hover:ring-white/60">
                <Play className="h-6 w-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          </div>
          {isPremiumOnly && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground gap-1">
              <Crown className="h-3 w-3" />
              LT+
            </Badge>
          )}
          {isPremiumReleased && (
            <Badge className="absolute top-2 right-2 bg-green-600 text-white gap-1">
              <Sparkles className="h-3 w-3" />
              LT+ Released
            </Badge>
          )}
          {/* Tags on top left */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {/* Auto-computed labels (Trending Now, New Release, Most Popular) */}
            {episode.computedLabel && (
              <Badge 
                className={
                  episode.computedLabel === "Trending Now" 
                    ? "bg-orange-500 text-white border-orange-600"
                    : episode.computedLabel === "New Release"
                    ? "bg-green-500 text-white border-green-600"
                    : "bg-purple-500 text-white border-purple-600"
                }
              >
                {episode.computedLabel === "Trending Now" && <TrendingUp className="h-3 w-3 mr-1" />}
                {episode.computedLabel === "New Release" && <Sparkles className="h-3 w-3 mr-1" />}
                {episode.computedLabel === "Most Popular" && <Star className="h-3 w-3 mr-1" />}
                {episode.computedLabel}
              </Badge>
            )}
            {/* Manual labels (Must Watch, Fan Favorite, etc) */}
            {episode.label && episode.label !== "none" && (
              <Badge 
                className="bg-accent text-accent-foreground"
              >
                {episode.label === "trending" ? "Trending Now" : 
                 episode.label === "must-watch" ? "Must Watch" :
                 episode.label === "fan-favorite" ? "Fan Favorite" :
                 episode.label === "popular" ? "Most Popular" :
                 episode.label === "editors-pick" ? "Editor's Pick" :
                 episode.label === "new" ? "New Release" :
                 episode.label === "classic" ? "Classic Episode" :
                 episode.label === "featured" ? "Featured" :
                 episode.label}
              </Badge>
            )}
            {/* Category badge */}
            {episode.category && (
              <Badge className="bg-primary text-primary-foreground">
                {episode.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="p-4 flex flex-col h-[120px]">
        <Link href={`/episode/${episode.id}`} className="flex-1">
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors cursor-pointer min-h-[2.5rem]" data-testid={`text-episode-title-${episode.id}`}>
            {episode.episodeNumber ? `Episode ${episode.episodeNumber}` : ""} 
            {episode.episodeNumber && episode.guestName ? " - " : ""}
            {(() => {
              const guests = [episode.guestName, episode.guest2Name, episode.guest3Name].filter(Boolean);
              return guests.length > 0 ? guests.join(", ") : episode.title;
            })()}
          </h3>
        </Link>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span className="text-sm text-muted-foreground">
            {episode.viewCount && episode.viewCount > 0 ? `${episode.viewCount.toLocaleString()} views` : ""}
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleListenClick}
            className="gap-1 shrink-0"
            data-testid={`button-listen-${episode.id}`}
          >
            <Headphones className="h-4 w-4" />
            Listen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EpisodeSection({ 
  title, 
  description,
  episodes, 
  icon: Icon,
  onListen,
  emptyMessage = "No episodes found"
}: { 
  title: string;
  description?: string;
  episodes: EpisodeWithLabels[];
  icon?: typeof Crown;
  onListen: (episode: EpisodeWithLabels) => void;
  emptyMessage?: string;
}) {
  if (episodes.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        <h2 className="text-2xl font-bold" data-testid={`text-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-muted-foreground mb-6">{description}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {episodes.map((episode) => (
          <EpisodePodcastCard 
            key={episode.id} 
            episode={episode} 
            onListen={onListen}
          />
        ))}
      </div>
    </section>
  );
}

function LtPlusBanner({ 
  episodeCount 
}: { 
  episodeCount: number;
}) {
  if (episodeCount === 0) return null;

  return (
    <div className="flex justify-center mb-6">
      <Link href="/plus">
        <div className="px-6 py-2 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 hover-elevate cursor-pointer" data-testid="banner-lt-plus">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm">Latest Talks+</span>
              <span className="text-muted-foreground text-sm">
                {episodeCount} exclusive episode{episodeCount !== 1 ? 's' : ''} available
              </span>
            </div>
            <Button size="sm" className="flex-shrink-0 gap-1 h-7" data-testid="button-join-lt-plus">
              <Crown className="h-3 w-3" />
              Join LT+
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function PodcastPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [listeningEpisode, setListeningEpisode] = useState<EpisodeWithLabels | null>(null);
  const [showMorePlatforms, setShowMorePlatforms] = useState(false);

  const { data: episodes, isLoading } = useQuery<EpisodeWithLabels[]>({
    queryKey: ["/api/episodes?status=published"],
  });

  const filterEpisodes = (eps: EpisodeWithLabels[] | undefined) => {
    if (!eps) return [];
    return eps
      .filter((episode) => {
        // Handle "Latest Talks+" filter - check isPremium field
        const matchesCategory = selectedCategory === "all" 
          || (selectedCategory === "latest-talks-plus" && episode.isPremium)
          || (selectedCategory !== "latest-talks-plus" && episode.category === selectedCategory);
        const matchesSearch = !searchQuery || 
          episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          episode.guestName?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
  };

  const filteredEpisodes = filterEpisodes(episodes);

  // Separate episodes into sections
  const premiumExclusive = filteredEpisodes.filter(ep => ep.isPremium && !ep.isPremiumReleased);
  const premiumReleased = filteredEpisodes.filter(ep => ep.isPremium && ep.isPremiumReleased);
  const regularEpisodes = filteredEpisodes.filter(ep => !ep.isPremium);

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Podcast</h1>
          <p className="text-muted-foreground mb-6">Browse all episodes - watch video or listen to audio only</p>

          {/* Listen On Your Favorite Platform */}
          <div className="bg-muted rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-center mb-6">Listen On Your Favorite Platform</h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://podcasts.apple.com/at/podcast/latest-talks/id1562182641"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-md font-medium hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms] bg-purple-600"
                data-testid="link-apple-podcasts"
              >
                <SiApplepodcasts className="h-5 w-5" />
                Apple Podcasts
              </a>
              <a
                href="https://open.spotify.com/show/24ep0wnTNCbSHTOZTEeY8F"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-md font-medium hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms] bg-green-600"
                data-testid="link-spotify"
              >
                <SiSpotify className="h-5 w-5" />
                Spotify
              </a>
              <a
                href="https://www.youtube.com/c/LatestTalks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-md font-medium hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms] bg-red-600"
                data-testid="link-youtube"
              >
                <SiYoutube className="h-5 w-5" />
                YouTube
              </a>
              <a
                href="https://www.yiddish24.com/cat/196"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-md font-medium hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms] bg-[#6B7A9A]"
                data-testid="link-yiddish24"
              >
                <img src={yiddish24Logo} alt="Yiddish24" className="h-6 w-6 rounded-sm" />
                Yiddish24
              </a>
              <Button
                variant="outline"
                onClick={() => setShowMorePlatforms(true)}
                className="inline-flex items-center gap-2 px-6 py-3 h-auto rounded-md font-medium hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms]"
                data-testid="button-view-more-platforms"
              >
                <ChevronDown className="h-5 w-5" />
                View More
              </Button>
            </div>
          </div>

          {/* More Platforms Dialog */}
          <Dialog open={showMorePlatforms} onOpenChange={setShowMorePlatforms}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">More Platforms</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-4">
                {morePlatforms.map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-6 py-3 rounded-lg text-white ${platform.color} hover:scale-[1.02] transition-all duration-[250ms] ease-out shadow-md hover:shadow-lg`}
                    data-testid={`link-platform-${platform.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <platform.icon className="h-6 w-6" />
                    <span className="font-semibold">{platform.name}</span>
                  </a>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`button-category-${cat.id}`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search episodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-episodes"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i}>
                  <Skeleton className="aspect-video" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEpisodes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-episodes">No episodes found</p>
            </div>
          ) : (
            <>
              {/* Latest Talks+ Promotional Banner - Small Strip */}
              <LtPlusBanner episodeCount={premiumExclusive.length + premiumReleased.length} />

              {/* Regular Episodes Section */}
              <EpisodeSection
                title="All Episodes"
                episodes={regularEpisodes}
                onListen={setListeningEpisode}
              />
            </>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={!!listeningEpisode} onOpenChange={() => setListeningEpisode(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              {listeningEpisode?.episodeNumber ? `Episode ${listeningEpisode.episodeNumber}` : ""} 
              {listeningEpisode?.episodeNumber && listeningEpisode?.guestName ? " - " : ""}
              {listeningEpisode?.guestName || listeningEpisode?.title}
            </DialogTitle>
          </DialogHeader>
          {listeningEpisode && (
            <div className="space-y-4">
              <ProtectedVideo 
                youtubeId={listeningEpisode.youtubeId} 
                title={listeningEpisode.title}
                autoplay={true}
                isPremium={listeningEpisode.isPremium ?? false}
              />
              <p className="text-sm text-muted-foreground text-center">
                Audio playing from YouTube - minimize video for audio-only experience
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
