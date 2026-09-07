import { useState } from "react";
import { Link } from "wouter";
import { Clock, User, Radio, Crown, Calendar, TrendingUp, Sparkles, Star, Headphones, Play } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Episode, EpisodeWithGuests } from "@shared/schema";
import ltPlusLogo from "@assets/LT+_Logo_1765168703665.png";

const EPISODE_LABELS = [
  { value: "none", label: "No Label" },
  { value: "trending", label: "Trending Now" },
  { value: "featured", label: "Featured" },
  { value: "new", label: "New Release" },
  { value: "editors-pick", label: "Editor's Pick" },
  { value: "popular", label: "Most Popular" },
  { value: "classic", label: "Classic Episode" },
  { value: "must-watch", label: "Must Watch" },
  { value: "fan-favorite", label: "Fan Favorite" },
];

interface EpisodeWithLabels extends Episode {
  computedLabel?: string | null;
  recentViews?: number;
  hasPrimeSponsor?: boolean;
  guest?: EpisodeWithGuests['guest'];
  guest2?: EpisodeWithGuests['guest2'];
  guest3?: EpisodeWithGuests['guest3'];
  host?: EpisodeWithGuests['host'];
}

interface EpisodeCardProps {
  episode: EpisodeWithLabels;
  onListen?: (episode: Episode) => void;
}

export default function EpisodeCard({ episode, onListen }: EpisodeCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const isValidYoutubeId = episode.youtubeId && 
    episode.youtubeId.length >= 11 && 
    !episode.youtubeId.startsWith('example');
  
  const thumbnailUrl = episode.thumbnailUrl || `https://i.ytimg.com/vi/${episode.youtubeId}/hqdefault.jpg`;
  const showFallback = imageError || !isValidYoutubeId;
  
  const hasPrime = episode.hasPrimeSponsor;
  
  return (
    <Link href={`/episode/${episode.id}`} data-testid={`link-episode-${episode.id}`}>
      <Card className={`overflow-visible card-lift cursor-pointer group border-0 shadow-md ${hasPrime ? 'ring-2 ring-amber-400' : ''}`}>
        <div className="relative bg-muted rounded-t-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          {!showFallback ? (
            <img 
              src={thumbnailUrl}
              alt={episode.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[250ms] ease-out group-hover:scale-105"
              data-testid={`img-episode-thumbnail-${episode.id}`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gradient-hero text-white">
              <Radio className="h-12 w-12 mb-2 opacity-60" />
              <span className="text-sm font-medium opacity-80">Episode #{episode.episodeNumber}</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-2 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm" />
              <div className="relative w-16 h-11 rounded-xl bg-[#FF0000]/90 flex items-center justify-center group-hover:bg-[#FF0000] group-hover:scale-110 transition-all duration-200 shadow-lg ring-2 ring-white/30 group-hover:ring-white/60">
                <Play className="h-6 w-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          </div>
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {episode.computedLabel && (
              <Badge 
                className={
                  episode.computedLabel === "Trending Now" 
                    ? "bg-orange-500 text-white border-orange-600"
                    : episode.computedLabel === "New Release"
                    ? "bg-green-500 text-white border-green-600"
                    : "bg-purple-500 text-white border-purple-600"
                }
                data-testid={`badge-auto-label-${episode.id}`}
              >
                {episode.computedLabel === "Trending Now" && <TrendingUp className="h-3 w-3 mr-1" />}
                {episode.computedLabel === "New Release" && <Sparkles className="h-3 w-3 mr-1" />}
                {episode.computedLabel === "Most Popular" && <Star className="h-3 w-3 mr-1" />}
                {episode.computedLabel}
              </Badge>
            )}
            {episode.label && episode.label !== "none" && (
              <Badge 
                className="bg-accent text-accent-foreground"
                data-testid={`badge-manual-label-${episode.id}`}
              >
                {EPISODE_LABELS.find(l => l.value === episode.label)?.label || episode.label}
              </Badge>
            )}
            {episode.category && (
              <Badge 
                className="bg-primary text-primary-foreground"
                data-testid={`badge-category-${episode.id}`}
              >
                {episode.category.replace('-', ' ')}
              </Badge>
            )}
            {episode.isPremium && (
              <Badge 
                className="bg-[#10213A] text-white px-2 py-0.5"
                data-testid={`badge-premium-${episode.id}`}
              >
                <img src={ltPlusLogo} alt="LT+" className="h-3 object-contain" />
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4 flex flex-col h-[130px]">
          <h3 
            className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] mb-2"
            data-testid={`text-episode-title-${episode.id}`}
          >
            {episode.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 min-h-[1rem]">
            {episode.guest?.name ? (
              <>
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{episode.guest.name}</span>
              </>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-auto gap-2">
            <span className="text-xs text-muted-foreground" data-testid={`text-views-${episode.id}`}>
              {episode.viewCount !== null && episode.viewCount > 0 
                ? `${episode.viewCount.toLocaleString()} views`
                : ''}
            </span>
            {onListen && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onListen(episode);
                }}
                className="gap-1 shrink-0"
                data-testid={`button-listen-${episode.id}`}
              >
                <Headphones className="h-4 w-4" />
                Listen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
