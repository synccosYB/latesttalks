import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Headphones } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import ProtectedVideo from "@/components/ProtectedVideo";
import type { Episode } from "@shared/schema";

const categories = [
  { id: "all", label: "All Posts" },
  { id: "podcast", label: "Podcast" },
  { id: "music-interviews", label: "Music Interviews" },
  { id: "seasonal", label: "Seasonal Projects" },
  { id: "latest-talks-plus", label: "Latest Talks+" },
];

export default function VideoPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [listeningEpisode, setListeningEpisode] = useState<Episode | null>(null);

  const { data: episodes, isLoading } = useQuery<Episode[]>({
    queryKey: ["/api/episodes?status=published&type=video"],
  });

  const filteredEpisodes = episodes
    ?.filter((episode) => {
      // Handle "Latest Talks+" filter - check isPremium field
      const matchesCategory = selectedCategory === "all" 
        || (selectedCategory === "latest-talks-plus" && episode.isPremium)
        || (selectedCategory !== "latest-talks-plus" && episode.category === selectedCategory);
      const matchesSearch = !searchQuery || 
        episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        episode.guestName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    ?.sort((a, b) => {
      // Sort by publishedAt date, newest first
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8" data-testid="text-page-title">Video Episodes</h1>

          {/* Categories */}
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

          {/* Search */}
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

          {/* Episodes Grid */}
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
          ) : filteredEpisodes?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-episodes">No episodes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEpisodes?.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} onListen={setListeningEpisode} />
              ))}
            </div>
          )}
        </div>
      </main>

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
              <ProtectedVideo youtubeId={listeningEpisode.youtubeId || ""} title={listeningEpisode.title} isPremium={listeningEpisode.isPremium ?? false} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
