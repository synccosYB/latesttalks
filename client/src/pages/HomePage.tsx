import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Play, Headphones, ExternalLink, Plane, Camera, Upload, ChevronDown, Video, Calendar, Users } from "lucide-react";
import { SiApplepodcasts, SiSpotify, SiYoutube } from "react-icons/si";
import { Radio, Podcast, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EpisodeCard from "@/components/EpisodeCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import WhatsAppOptIn from "@/components/WhatsAppOptIn";
import ProtectedVideo from "@/components/ProtectedVideo";
import type { Episode, EpisodeWithGuests, UpcomingEpisodeInfo } from "@shared/schema";
import { stripHtmlToText } from "@shared/textUtils";
import elAlLogo from "@assets/image_1764475161415.png";
import yiddish24Logo from "@assets/400x400ia-75_1765316187929.webp";
import zingMusicLogo from "@assets/Zing_Music_Apple_1766532262253.webp";

const ZingMusicIcon = ({ className }: { className?: string }) => (
  <img src={zingMusicLogo} alt="Zing Music" className={`h-5 w-5 rounded object-contain ${className || ''}`} />
);

// Unified spacing constants
const SECTION_PADDING = "py-8 sm:py-10";
const SECTION_HEADER_MARGIN = "mb-4";

const mainPlatforms = [
  { name: "Apple Podcasts", icon: SiApplepodcasts, url: "https://podcasts.apple.com/at/podcast/latest-talks/id1562182641", color: "bg-purple-600" },
  { name: "Spotify", icon: SiSpotify, url: "https://open.spotify.com/show/24ep0wnTNCbSHTOZTEeY8F", color: "bg-green-600" },
  { name: "YouTube", icon: SiYoutube, url: "https://www.youtube.com/c/LatestTalks", color: "bg-red-600" },
  { name: "Zing Music", icon: ZingMusicIcon, url: "https://zingmusic.app/?rssId=9629&title=Latest%20Talks", color: "bg-violet-900" },
];

const morePlatforms = [
  { name: "Podbean", icon: Podcast, url: "https://www.podbean.com/podcast-detail/bz3c7-1b4e7b/Latest-Talks-Podcast", color: "bg-orange-500" },
  { name: "KosherTube", icon: Radio, url: "https://koshertube.co.uk/latest-talks/", color: "bg-blue-600" },
  { name: "AhBlick Live", icon: Headphones, url: "https://ahblicklive.com/archives.php?tag=%D7%9C%D7%A2%D7%99%D7%98%D7%A2%D7%A1%D7%98%20%D7%98%D7%90%D7%90%D7%A7%D7%A1&allowed_categories=2", color: "bg-teal-600" },
];

export default function HomePage() {
  const [listeningEpisode, setListeningEpisode] = useState<Episode | null>(null);
  const [showMorePlatforms, setShowMorePlatforms] = useState(false);
  
  const { data: episodes, isLoading } = useQuery<EpisodeWithGuests[]>({
    queryKey: ["/api/episodes?status=published"],
  });

  const { data: upcomingEpisode } = useQuery<UpcomingEpisodeInfo | null>({
    queryKey: ["/api/upcoming-episode"],
  });

  // Filter out premium episodes (already sorted by episode number from API)
  const publicEpisodes = episodes?.filter(ep => !ep.isPremium) || [];
  const featuredEpisode = publicEpisodes[0];
  const recentEpisodes = publicEpisodes.slice(1, 5);

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      {/* Hero Section */}
      <section className="relative gradient-hero-enhanced text-white py-6 sm:py-8 lg:py-10 overflow-hidden">
        {featuredEpisode && (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ 
                backgroundImage: `url(${featuredEpisode.thumbnailUrl || `https://i.ytimg.com/vi/${featuredEpisode.youtubeId}/maxresdefault.jpg`})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#10213A]/85 via-[#10213A]/80 to-[#10213A]/90" />
          </>
        )}
        
        <div className="bg-blob w-96 h-96 bg-primary/30 -top-20 -left-20 animate-float" style={{ animationDelay: '0s' }} />
        <div className="bg-blob w-80 h-80 bg-orange-500/20 top-1/2 -right-20 animate-float" style={{ animationDelay: '1s' }} />
        <div className="bg-blob w-64 h-64 bg-purple-600/15 bottom-0 left-1/3 animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="absolute inset-0 shimmer opacity-15" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="hero-headline mb-2 sm:mb-3 tracking-tight animate-fade-up" data-testid="text-hero-title">
              <span className="uppercase tracking-wide">The Biggest Jewish Network </span>
              <span className="text-[#adc3e4] text-3xl sm:text-4xl lg:text-5xl">in Yiddish</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-3 max-w-2xl mx-auto leading-relaxed animate-fade-up-delay-2">
              Here we shmooze and try to cover all kinds of interesting topics, 
              so you can enjoy top-quality Yiddish entertainment.
            </p>
            <div className="flex justify-center animate-fade-up-delay-2">
              <Link href="/podcast">
                <Button size="lg" className="btn-gradient glow-red-hover text-white text-base sm:text-lg px-8 sm:px-10 py-5 hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms]" data-testid="button-watch-listen">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Watch / Listen Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Episode */}
      {featuredEpisode && (
        <section className={`${SECTION_PADDING} bg-card`}>
          <div className="max-w-7xl mx-auto px-4">
            <div className={`flex items-center gap-3 ${SECTION_HEADER_MARGIN}`}>
              <div className="h-1 w-12 gradient-accent rounded-full" />
              <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-featured-heading">Latest Episode</h2>
            </div>
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card to-muted/50">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                <div className="lg:col-span-3 relative group">
                  <div className="aspect-video lg:aspect-auto lg:h-full overflow-hidden min-h-[280px] lg:min-h-[360px]">
                    <ProtectedVideo 
                      youtubeId={featuredEpisode.youtubeId} 
                      title={featuredEpisode.title}
                      isPremium={featuredEpisode.isPremium ?? false}
                      className="h-full"
                    />
                  </div>
                </div>
                <div className="lg:col-span-2 p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
                  <span className="inline-flex items-center gap-2 text-sm font-bold mb-2">
                    <span className="gradient-text">EPISODE #{featuredEpisode.episodeNumber}</span>
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{featuredEpisode.publishedAt ? new Date(featuredEpisode.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'New'}</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 leading-tight" data-testid="text-featured-title">
                    {featuredEpisode.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3 text-sm sm:text-base leading-relaxed">
                    {stripHtmlToText(featuredEpisode.description)}
                  </p>
                  {featuredEpisode.guest?.name && (
                    <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {featuredEpisode.guest.name.charAt(0)}
                      </span>
                      <span>With <span className="font-semibold text-foreground">{featuredEpisode.guest.name}</span></span>
                    </p>
                  )}
                  <Link href={`/episode/${featuredEpisode.id}`}>
                    <Button className="btn-gradient glow-red-hover w-full sm:w-auto hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms]" data-testid="button-watch-full-episode">
                      <Play className="h-4 w-4 mr-2 fill-white" />
                      Watch Full Episode
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Listen On Platforms */}
      <section className={`${SECTION_PADDING} bg-background`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className={`text-xl sm:text-2xl font-bold text-center ${SECTION_HEADER_MARGIN}`} data-testid="text-listen-heading">
            Listen On Your Favorite Platform
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
            {mainPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg text-white ${platform.color} hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms] ease-out shadow-md hover:shadow-lg`}
                data-testid={`link-platform-${platform.name.toLowerCase().replace(' ', '-')}`}
              >
                <platform.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base">{platform.name}</span>
              </a>
            ))}
            <a
              href="https://www.yiddish24.com/cat/196"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg text-white bg-[#6B7A9A] hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms] ease-out shadow-md hover:shadow-lg"
              data-testid="link-platform-yiddish24"
            >
              <img src={yiddish24Logo} alt="Yiddish24" className="h-6 w-6 rounded-sm" />
              <span className="font-semibold text-sm sm:text-base">Yiddish24</span>
            </a>
            <Button
              variant="outline"
              onClick={() => setShowMorePlatforms(true)}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 h-auto rounded-lg hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms] ease-out shadow-md hover:shadow-lg"
              data-testid="button-view-more-platforms"
            >
              <ChevronDown className="h-5 w-5" />
              <span className="font-semibold text-sm sm:text-base">View More</span>
            </Button>
          </div>
        </div>
      </section>

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

      {/* In-Flight Entertainment Section */}
      <section className={`${SECTION_PADDING} bg-muted`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className={`text-center ${SECTION_HEADER_MARGIN}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Plane className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-inflight-heading">
                Watch Us in the Sky
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Latest Talks is now available on airline in-flight entertainment systems. 
              Enjoy our conversations at 30,000 feet!
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* El Al - Active Partner */}
              <Link href="/on-el-al">
                <Card className="overflow-hidden border-0 shadow-lg group cursor-pointer hover:shadow-xl transition-all duration-[250ms]" data-testid="card-elal-airline">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 sm:p-6">
                      <div className="w-full h-16 flex items-center justify-center bg-white rounded-lg p-3 group-hover:scale-[1.02] transition-transform duration-[250ms]">
                        <img 
                          src={elAlLogo} 
                          alt="El Al Israel Airlines" 
                          className="max-h-full max-w-full object-contain"
                          data-testid="img-elal-logo"
                        />
                      </div>
                    </div>
                    <CardContent className="p-4 bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-base">El Al Israel Airlines</p>
                          <p className="text-xs text-muted-foreground">Available Now</p>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
              
              {/* Coming Soon */}
              <Link href="/on-el-al">
                <Card className="overflow-hidden border-dashed border-2 opacity-70 cursor-pointer hover:opacity-90 transition-all duration-[250ms]" data-testid="card-more-airlines">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-gray-400 to-gray-500 p-5 sm:p-6">
                      <div className="w-full h-16 flex items-center justify-center bg-white/80 rounded-lg p-3">
                        <Plane className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <CardContent className="p-4 bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-base text-muted-foreground">More Airlines</p>
                          <p className="text-xs text-muted-foreground">Coming Soon</p>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            </div>
            
            {/* Upload CTA */}
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-bold text-sm sm:text-base">Watched Latest Talks on a flight?</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Share your in-flight photo and join our community gallery!</p>
                </div>
                <Link href="/on-el-al">
                  <Button className="btn-gradient glow-red-hover hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms]" data-testid="button-share-experience">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advertise Section - Compact centered strip with thumbnail/guest image */}
      {upcomingEpisode?.isActive && (
        <section className="py-4 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-lg shadow-sm">
              {/* Thumbnail or Guest Image */}
              <div className="flex-shrink-0">
                {upcomingEpisode.thumbnailUrl ? (
                  <img 
                    src={upcomingEpisode.thumbnailUrl} 
                    alt={upcomingEpisode.guestName || "Upcoming episode"} 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-md object-cover border border-blue-300 shadow-sm"
                    data-testid="img-upcoming-thumbnail"
                  />
                ) : upcomingEpisode.guestImageUrl ? (
                  <img 
                    src={upcomingEpisode.guestImageUrl} 
                    alt={upcomingEpisode.guestName || "Upcoming guest"} 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-blue-300 shadow-sm"
                    data-testid="img-upcoming-guest"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-blue-500 flex items-center justify-center">
                    <Video className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-blue-900 dark:text-blue-100" data-testid="text-advertise-title">
                    Advertise on Our Next Episode
                  </h3>
                  {upcomingEpisode.guestName && (
                    <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                      with {upcomingEpisode.guestName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  {upcomingEpisode.topic && (
                    <span className="truncate max-w-[200px] sm:max-w-none">{upcomingEpisode.topic}</span>
                  )}
                  {upcomingEpisode.topic && upcomingEpisode.releaseDate && <span>•</span>}
                  {upcomingEpisode.releaseDate && (
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Calendar className="h-3 w-3" />
                      {upcomingEpisode.releaseDate}
                    </span>
                  )}
                </div>
              </div>
              
              {/* CTA Button - Close to content */}
              <Link href="/ads" className="flex-shrink-0 ml-auto">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm" data-testid="button-advertise-cta">
                  Advertise
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent Episodes */}
      <section className={`${SECTION_PADDING} bg-background`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className={`flex items-center justify-between ${SECTION_HEADER_MARGIN} gap-4`}>
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 gradient-accent rounded-full" />
              <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-recent-heading">Recent Episodes</h2>
            </div>
            <Link href="/podcast">
              <Button variant="outline" size="sm" className="border-primary/30 hover:border-primary hover:bg-primary/5 hover:scale-105 hover:-translate-y-1 transition-all duration-[250ms]" data-testid="button-view-all">View All</Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <Skeleton className="aspect-video" />
                  <CardContent className="p-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentEpisodes.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} onListen={setListeningEpisode} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter & WhatsApp Signup */}
      <section className={`${SECTION_PADDING} bg-card`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="min-w-0"><NewsletterSignup /></div>
            <div className="min-w-0"><WhatsAppOptIn variant="card" /></div>
          </div>
        </div>
      </section>

      {/* Audio Player Modal */}
      <Dialog open={!!listeningEpisode} onOpenChange={(open) => !open && setListeningEpisode(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-primary" />
              {listeningEpisode?.title}
            </DialogTitle>
          </DialogHeader>
          {listeningEpisode && (
            <div className="aspect-video">
              <ProtectedVideo youtubeId={listeningEpisode.youtubeId || ""} title={listeningEpisode.title} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
