import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Image, User, Video, Building2, Camera, Filter, Check, Upload, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Episode, Guest, Sponsor, CommunityPhoto } from "@shared/schema";

interface MediaItem {
  id: string;
  url: string;
  title: string;
  source: "episode" | "guest" | "sponsor" | "community" | "uploaded";
  sourceId: string;
}

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  title?: string;
}

export function MediaPickerDialog({ 
  open, 
  onOpenChange, 
  onSelect,
  title = "Select Image from Library"
}: MediaPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<MediaItem[]>([]);
  const { toast } = useToast();

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/object-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "public" }),
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadUrl,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const newImages: MediaItem[] = result.successful.map((file: any, index: number) => {
        const url = file.uploadURL?.split("?")[0] || file.response?.uploadURL?.split("?")[0];
        return {
          id: `uploaded-${Date.now()}-${index}`,
          url: url,
          title: file.name || "Uploaded Image",
          source: "uploaded" as const,
          sourceId: `upload-${Date.now()}-${index}`,
        };
      });
      
      setUploadedImages(prev => [...newImages, ...prev]);
      
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      
      toast({
        title: "Upload complete",
        description: `${result.successful.length} image${result.successful.length > 1 ? "s" : ""} uploaded successfully`,
      });
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

    uploadedImages.forEach((img) => {
      items.push(img);
    });

    return items;
  }, [episodes, guests, sponsors, communityPhotos, uploadedImages]);

  const filteredMedia = useMemo(() => {
    return allMedia.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.url.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || item.source === filter;
      return matchesSearch && matchesFilter;
    });
  }, [allMedia, search, filter]);

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
      case "uploaded": return "bg-teal-500/20 text-teal-600 border-teal-500/30";
      default: return "";
    }
  };

  const handleSelect = (url: string) => {
    setSelectedUrl(url);
  };

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onOpenChange(false);
      setSelectedUrl(null);
      setSearch("");
      setFilter("all");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedUrl(null);
    setSearch("");
    setFilter("all");
  };

  const isLoading = !episodes || !guests || !sponsors || !communityPhotos;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-media-picker-search"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-40" data-testid="select-media-picker-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
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
          <ObjectUploader
            maxNumberOfFiles={5}
            maxFileSize={10485760}
            allowedFileTypes={["image/*"]}
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload
          </ObjectUploader>
        </div>

        <div className="text-sm text-muted-foreground mb-2">
          {filteredMedia.length} image{filteredMedia.length !== 1 ? "s" : ""} available
          {selectedUrl && <span className="ml-2 text-primary font-medium">• 1 selected</span>}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filteredMedia.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.url)}
                  className={`group relative rounded-lg overflow-hidden border-2 transition-all text-left ${
                    selectedUrl === item.url 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-transparent hover:border-primary/50"
                  }`}
                  data-testid={`media-picker-item-${item.id}`}
                >
                  <div className="aspect-square bg-muted">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="55%" text-anchor="middle" fill="%23999" font-size="10">Error</text></svg>';
                      }}
                    />
                  </div>
                  
                  {selectedUrl === item.url && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-white text-xs font-medium truncate mb-1">
                      {item.title}
                    </p>
                    <Badge className={`text-[10px] px-1.5 py-0 w-fit ${getSourceColor(item.source)}`}>
                      {getSourceIcon(item.source)}
                      <span className="ml-1 capitalize">{item.source}</span>
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={handleClose} data-testid="button-media-picker-cancel">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedUrl}
            data-testid="button-media-picker-confirm"
          >
            <Check className="h-4 w-4 mr-2" />
            Use Selected Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
