import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Copy, Check, Image, User, Video, Building2, Camera, Filter, Upload, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Episode, Guest, Sponsor, CommunityPhoto } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface MediaItem {
  id: string;
  url: string;
  title: string;
  source: "episode" | "guest" | "sponsor" | "community" | "uploaded";
  sourceId: string;
}

interface UploadedMedia {
  id: string;
  url: string;
  name: string;
  uploadedAt: Date;
}

export default function AdminMediaLibrary() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const newMedia: UploadedMedia[] = result.successful.map((file) => ({
        id: `uploaded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: file.uploadURL || "",
        name: file.name || "Uploaded Image",
        uploadedAt: new Date(),
      }));
      setUploadedMedia((prev) => [...newMedia, ...prev]);
      toast({ title: "Image uploaded successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
    }
  };

  const { data: episodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: guests } = useQuery<Guest[]>({
    queryKey: ["/api/guests"],
  });

  const { data: sponsors } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const { data: communityPhotos } = useQuery<CommunityPhoto[]>({
    queryKey: ["/api/community-photos?status=approved"],
  });

  const allMedia = useMemo(() => {
    const items: MediaItem[] = [];

    episodes?.forEach((ep) => {
      if (ep.thumbnailUrl) {
        items.push({
          id: `ep-${ep.id}`,
          url: ep.thumbnailUrl,
          title: `Episode ${ep.episodeNumber || ""}: ${ep.title}`,
          source: "episode",
          sourceId: ep.id,
        });
      }
    });

    guests?.forEach((guest) => {
      if (guest.imageUrl) {
        items.push({
          id: `guest-${guest.id}`,
          url: guest.imageUrl,
          title: guest.name,
          source: "guest",
          sourceId: guest.id,
        });
      }
    });

    sponsors?.forEach((sponsor) => {
      if (sponsor.logoUrl) {
        items.push({
          id: `sponsor-${sponsor.id}`,
          url: sponsor.logoUrl,
          title: sponsor.name,
          source: "sponsor",
          sourceId: sponsor.id,
        });
      }
    });

    communityPhotos?.forEach((photo) => {
      if (photo.imageUrl) {
        items.push({
          id: `community-${photo.id}`,
          url: photo.imageUrl,
          title: photo.caption || `Community Photo`,
          source: "community",
          sourceId: photo.id,
        });
      }
    });

    uploadedMedia.forEach((media) => {
      if (media.url) {
        items.push({
          id: media.id,
          url: media.url,
          title: media.name,
          source: "uploaded",
          sourceId: media.id,
        });
      }
    });

    return items;
  }, [episodes, guests, sponsors, communityPhotos, uploadedMedia]);

  const filteredMedia = useMemo(() => {
    return allMedia.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.url.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || item.source === filter;
      return matchesSearch && matchesFilter;
    });
  }, [allMedia, search, filter]);

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast({ title: "URL copied to clipboard!" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "episode": return <Video className="h-3 w-3" />;
      case "guest": return <User className="h-3 w-3" />;
      case "sponsor": return <Building2 className="h-3 w-3" />;
      case "community": return <Camera className="h-3 w-3" />;
      case "uploaded": return <Upload className="h-3 w-3" />;
      default: return <Image className="h-3 w-3" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "episode": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "guest": return "bg-purple-500/20 text-purple-600 border-purple-500/30";
      case "sponsor": return "bg-amber-500/20 text-amber-600 border-amber-500/30";
      case "community": return "bg-green-500/20 text-green-600 border-green-500/30";
      case "uploaded": return "bg-pink-500/20 text-pink-600 border-pink-500/30";
      default: return "";
    }
  };

  const isLoading = !episodes || !guests || !sponsors || !communityPhotos;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-media-library-title">
              <Image className="h-6 w-6" />
              Media Library
            </h1>
            <p className="text-muted-foreground">
              Browse and reuse images already uploaded to your site
            </p>
          </div>
          <ObjectUploader
            maxNumberOfFiles={5}
            maxFileSize={10485760}
            allowedFileTypes={["image/*"]}
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Image
          </ObjectUploader>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or URL..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-media-search"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-media-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="episode">Episodes</SelectItem>
                  <SelectItem value="guest">Guests</SelectItem>
                  <SelectItem value="sponsor">Sponsors</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              {filteredMedia.length} image{filteredMedia.length !== 1 ? "s" : ""} found
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No images found</p>
                <p className="text-sm">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-lg overflow-hidden border bg-muted/30 hover:border-primary/50 transition-all"
                    data-testid={`media-item-${item.id}`}
                  >
                    <div className="aspect-square">
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="55%" text-anchor="middle" fill="%23999" font-size="10">Error</text></svg>';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <p className="text-white text-xs font-medium truncate mb-1">
                        {item.title}
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        <Badge className={`text-[10px] px-1.5 py-0 ${getSourceColor(item.source)}`}>
                          {getSourceIcon(item.source)}
                          <span className="ml-1 capitalize">{item.source}</span>
                        </Badge>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-xs px-2"
                          onClick={() => copyToClipboard(item.url, item.id)}
                          data-testid={`button-copy-${item.id}`}
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy URL
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
