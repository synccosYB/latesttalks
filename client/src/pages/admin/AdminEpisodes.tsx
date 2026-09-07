import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Eye, Crown, Tag, ExternalLink, Sparkles, Loader2, User, MessageCircle, Send, TrendingUp, Star, Zap, Video, X, Radio, Building2 } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Episode, Guest, WhatsappTemplate, Sponsor, EpisodeSponsor } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EpisodeWithLabels extends Episode {
  computedLabel?: string | null;
  recentViews?: number;
}
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface YouTubeMetadata {
  videoId: string;
  title: string;
  fullTitle: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  episodeNumber: number | null;
  guestName: string | null;
}

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

export default function AdminEpisodes() {
  const [search, setSearch] = useState("");
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isPremiumReleased, setIsPremiumReleased] = useState(false);
  const [videoFileUrl, setVideoFileUrl] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [selectedGuest2Id, setSelectedGuest2Id] = useState<string>("");
  const [selectedGuest3Id, setSelectedGuest3Id] = useState<string>("");
  const [selectedHostId, setSelectedHostId] = useState<string>("");
  const [isLive, setIsLive] = useState(false);
  const [whatsappEpisodeId, setWhatsappEpisodeId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>("");
  const [sponsorAdText, setSponsorAdText] = useState("");
  const [sponsorPromoCode, setSponsorPromoCode] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    episodeNumber: "",
    youtubeUrl: "",
    description: "",
  });
  const { toast } = useToast();

  const { data: episodes, isLoading } = useQuery<EpisodeWithLabels[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: guests } = useQuery<Guest[]>({
    queryKey: ["/api/guests"],
  });

  const { data: whatsappStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/whatsapp/status"],
  });

  const { data: whatsappTemplates } = useQuery<WhatsappTemplate[]>({
    queryKey: ["/api/whatsapp/templates"],
    enabled: !!whatsappStatus?.configured,
  });

  const { data: whatsappStats } = useQuery<{ activeContacts: number }>({
    queryKey: ["/api/whatsapp/stats"],
    enabled: !!whatsappStatus?.configured,
  });

  const { data: sponsors } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const { data: episodeSponsors, refetch: refetchEpisodeSponsors } = useQuery<(EpisodeSponsor & { sponsor?: Sponsor })[]>({
    queryKey: ["/api/episodes", editingEpisode?.id, "sponsors"],
    enabled: !!editingEpisode?.id,
  });

  const whatsappBroadcastMutation = useMutation({
    mutationFn: async ({ episodeId, templateName }: { episodeId: string; templateName: string }) => {
      const res = await apiRequest("POST", "/api/whatsapp/broadcast/episode", { episodeId, templateName });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/send-logs"] });
      toast({ 
        title: "Episode broadcast sent", 
        description: `Sent to ${data.sentCount} WhatsApp subscribers` 
      });
      setWhatsappEpisodeId(null);
      setSelectedTemplate("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to broadcast", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const resetFormData = () => {
    setFormData({
      title: "",
      episodeNumber: "",
      youtubeUrl: "",
      description: "",
    });
    setEditingEpisode(null);
    setIsPremium(false);
    setIsPremiumReleased(false);
    setIsLive(false);
    setSelectedGuestId("");
    setSelectedGuest2Id("");
    setSelectedGuest3Id("");
    setSelectedHostId("");
  };

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Episode>) => {
      const res = await apiRequest("POST", "/api/episodes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      setIsDialogOpen(false);
      resetFormData();
      toast({ title: "Episode created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create episode", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Episode> }) => {
      const res = await apiRequest("PATCH", `/api/episodes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      setIsDialogOpen(false);
      resetFormData();
      toast({ title: "Episode updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update episode", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/episodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      toast({ title: "Episode deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete episode", variant: "destructive" });
    },
  });

  const addSponsorMutation = useMutation({
    mutationFn: async (data: { episodeId: string; sponsorId: string; adText?: string; promoCode?: string }) => {
      const res = await apiRequest("POST", "/api/episode-sponsors", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", editingEpisode?.id, "sponsors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors", editingEpisode?.id, "episodes"] });
      setSelectedSponsorId("");
      setSponsorAdText("");
      setSponsorPromoCode("");
      toast({ title: "Sponsor linked to episode" });
    },
    onError: () => {
      toast({ title: "Failed to link sponsor", variant: "destructive" });
    },
  });

  const removeSponsorMutation = useMutation({
    mutationFn: async (episodeSponsorId: string) => {
      await apiRequest("DELETE", `/api/episode-sponsors/${episodeSponsorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", editingEpisode?.id, "sponsors"] });
      toast({ title: "Sponsor removed from episode" });
    },
    onError: () => {
      toast({ title: "Failed to remove sponsor", variant: "destructive" });
    },
  });

  const filteredEpisodes = episodes?.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      ((e as any).guest?.name?.toLowerCase()?.includes(search.toLowerCase()) ?? false) ||
      (e.episodeNumber && e.episodeNumber.toString().includes(search))
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElements = new FormData(e.currentTarget);
    const labelValue = formElements.get("label") as string;
    const data = {
      title: formData.title,
      episodeNumber: parseInt(formData.episodeNumber) || null,
      youtubeUrl: formData.youtubeUrl,
      youtubeId: extractYoutubeId(formData.youtubeUrl),
      description: formData.description,
      guestId: selectedGuestId || null,
      guest2Id: selectedGuest2Id || null,
      guest3Id: selectedGuest3Id || null,
      hostId: selectedHostId || null,
      isLive,
      status: formElements.get("status") as string,
      type: formElements.get("type") as string,
      category: formElements.get("category") as string,
      label: labelValue && labelValue !== "none" ? labelValue : null,
      isPremium,
      isPremiumReleased: isPremium ? isPremiumReleased : false,
      premiumReleasedAt: isPremium && isPremiumReleased && !editingEpisode?.isPremiumReleased ? new Date() : editingEpisode?.premiumReleasedAt,
      videoFileUrl: isPremium ? videoFileUrl : null,
    };

    if (editingEpisode) {
      updateMutation.mutate({ id: editingEpisode.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (episode: Episode) => {
    setEditingEpisode(episode);
    setIsPremium(episode.isPremium || false);
    setIsPremiumReleased(episode.isPremiumReleased || false);
    setIsLive(episode.isLive || false);
    setVideoFileUrl(episode.videoFileUrl || null);
    setSelectedGuestId(episode.guestId || "");
    setSelectedGuest2Id(episode.guest2Id || "");
    setSelectedGuest3Id(episode.guest3Id || "");
    setSelectedHostId(episode.hostId || "");
    setFormData({
      title: episode.title || "",
      episodeNumber: episode.episodeNumber?.toString() || "",
      youtubeUrl: episode.youtubeUrl || "",
      description: episode.description || "",
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingEpisode(null);
    setIsPremium(false);
    setIsPremiumReleased(false);
    setIsLive(false);
    setVideoFileUrl(null);
    setVideoThumbnail(null);
    setSelectedGuestId("");
    setSelectedGuest2Id("");
    setSelectedGuest3Id("");
    setSelectedHostId("");
    setFormData({
      title: "",
      episodeNumber: "",
      youtubeUrl: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const handleGuestSelect = (guestId: string) => {
    setSelectedGuestId(guestId);
    if (guestId && guests) {
      const guest = guests.find(g => g.id === guestId);
      if (guest) {
        // Auto-format title as "Guest Name - Episode #X"
        const episodeNum = formData.episodeNumber;
        const newTitle = episodeNum 
          ? `${guest.name} - Episode #${episodeNum}`
          : guest.name;
        setFormData(prev => ({ 
          ...prev, 
          title: newTitle
        }));
      }
    }
  };

  const handleGuest2Select = (guestId: string) => {
    setSelectedGuest2Id(guestId);
  };

  const handleGuest3Select = (guestId: string) => {
    setSelectedGuest3Id(guestId);
  };
  
  const handleHostSelect = (hostId: string) => {
    setSelectedHostId(hostId);
  };

  const extractYoutubeId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : url;
  };

  const fetchYouTubeMetadata = async () => {
    if (!formData.youtubeUrl) {
      toast({ title: "Please enter a YouTube URL first", variant: "destructive" });
      return;
    }

    setIsFetchingMetadata(true);
    try {
      const response = await apiRequest("POST", "/api/youtube/metadata", { 
        url: formData.youtubeUrl 
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch video info");
      }

      const metadata: YouTubeMetadata = await response.json();
      
      // Format title as "Guest Name - Episode #X"
      let formattedTitle = "";
      const guestName = metadata.guestName || "";
      const episodeNum = metadata.episodeNumber;
      
      if (guestName && episodeNum) {
        formattedTitle = `${guestName} - Episode #${episodeNum}`;
      } else if (guestName) {
        formattedTitle = guestName;
      } else if (episodeNum) {
        formattedTitle = `Episode #${episodeNum}`;
      } else {
        formattedTitle = metadata.title || "";
      }
      
      setFormData(prev => ({
        ...prev,
        title: formattedTitle || prev.title,
        description: metadata.description || prev.description,
        episodeNumber: episodeNum?.toString() || prev.episodeNumber,
      }));

      toast({ 
        title: "Video info loaded!", 
        description: formattedTitle
      });
    } catch (error: any) {
      toast({ 
        title: "Could not fetch video info", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Episodes</h1>
            <p className="text-muted-foreground">Manage podcast episodes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} data-testid="button-add-episode">
                <Plus className="h-4 w-4 mr-2" />
                Add Episode
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEpisode ? "Edit Episode" : "Add New Episode"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">YouTube URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="youtubeUrl"
                      name="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                      required
                      className="flex-1"
                      data-testid="input-youtube-url"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={fetchYouTubeMetadata}
                      disabled={isFetchingMetadata || !formData.youtubeUrl}
                      data-testid="button-fetch-metadata"
                    >
                      {isFetchingMetadata ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span className="ml-2">Auto-Fill</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a YouTube URL and click Auto-Fill to populate title, description, episode number, and guest name
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      data-testid="input-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="episodeNumber">Episode Number</Label>
                    <Input
                      id="episodeNumber"
                      name="episodeNumber"
                      type="number"
                      value={formData.episodeNumber}
                      onChange={(e) => {
                        const newEpNum = e.target.value;
                        // Get guest name from selected guest
                        const guestName = selectedGuestId && guests 
                          ? guests.find(g => g.id === selectedGuestId)?.name 
                          : null;
                        setFormData(prev => {
                          // Auto-format title as "Guest Name - Episode #X"
                          let newTitle = prev.title;
                          if (guestName && newEpNum) {
                            newTitle = `${guestName} - Episode #${newEpNum}`;
                          } else if (guestName) {
                            newTitle = guestName;
                          } else if (newEpNum) {
                            newTitle = `Episode #${newEpNum}`;
                          }
                          return { ...prev, episodeNumber: newEpNum, title: newTitle };
                        });
                      }}
                      data-testid="input-episode-number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    placeholder="Enter episode description... Use the toolbar to format text."
                    data-testid="input-description"
                  />
                </div>
                <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    Guest & Host Information
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Link episodes to guests/hosts. Names and info come from their profiles and update automatically across all episodes.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedGuest">Primary Guest</Label>
                      <Select 
                        value={selectedGuestId || "none"} 
                        onValueChange={(value) => handleGuestSelect(value === "none" ? "" : value)}
                      >
                        <SelectTrigger data-testid="select-guest">
                          <SelectValue placeholder="Select a guest..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No guest</SelectItem>
                          {guests?.map((guest) => (
                            <SelectItem key={guest.id} value={guest.id}>
                              {guest.name} {guest.company ? `(${guest.company})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedHost">Host</Label>
                      <Select 
                        value={selectedHostId || "none"} 
                        onValueChange={(value) => handleHostSelect(value === "none" ? "" : value)}
                      >
                        <SelectTrigger data-testid="select-host">
                          <SelectValue placeholder="Select a host..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No host specified</SelectItem>
                          {guests?.filter(g => g.roles?.includes('host')).map((guest) => (
                            <SelectItem key={guest.id} value={guest.id}>
                              {guest.name}
                            </SelectItem>
                          ))}
                          {/* Also show all guests in case host role not assigned yet */}
                          {guests?.filter(g => !g.roles?.includes('host')).length ? (
                            <>
                              {guests?.filter(g => !g.roles?.includes('host')).map((guest) => (
                                <SelectItem key={guest.id} value={guest.id}>
                                  {guest.name} (guest)
                                </SelectItem>
                              ))}
                            </>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedGuest2">Second Guest (optional)</Label>
                      <Select 
                        value={selectedGuest2Id || "none"} 
                        onValueChange={(value) => handleGuest2Select(value === "none" ? "" : value)}
                      >
                        <SelectTrigger data-testid="select-guest-2">
                          <SelectValue placeholder="Select 2nd guest..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No second guest</SelectItem>
                          {guests?.map((guest) => (
                            <SelectItem key={guest.id} value={guest.id}>
                              {guest.name} {guest.company ? `(${guest.company})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedGuest3">Third Guest (optional)</Label>
                      <Select 
                        value={selectedGuest3Id || "none"} 
                        onValueChange={(value) => handleGuest3Select(value === "none" ? "" : value)}
                      >
                        <SelectTrigger data-testid="select-guest-3">
                          <SelectValue placeholder="Select 3rd guest..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No third guest</SelectItem>
                          {guests?.map((guest) => (
                            <SelectItem key={guest.id} value={guest.id}>
                              {guest.name} {guest.company ? `(${guest.company})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingEpisode?.status || "draft"}>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" defaultValue={editingEpisode?.type || "video"}>
                      <SelectTrigger data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={editingEpisode?.category || "podcast"}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="podcast">Podcast</SelectItem>
                        <SelectItem value="live-podcast">Live Podcast</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="music-interviews">Music Interviews</SelectItem>
                        <SelectItem value="seasonal">Seasonal Projects</SelectItem>
                        <SelectItem value="special">Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Label
                    </Label>
                    <Select name="label" defaultValue={editingEpisode?.label || "none"}>
                      <SelectTrigger data-testid="select-label">
                        <SelectValue placeholder="Select label" />
                      </SelectTrigger>
                      <SelectContent>
                        {EPISODE_LABELS.map((labelOption) => (
                          <SelectItem key={labelOption.value} value={labelOption.value}>
                            {labelOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700">
                      <Radio className="h-4 w-4" />
                      <Label htmlFor="isLive" className="font-medium cursor-pointer">
                        Live Podcast
                      </Label>
                    </div>
                    <Switch
                      id="isLive"
                      checked={isLive}
                      onCheckedChange={setIsLive}
                      data-testid="switch-live"
                    />
                    <span className="text-sm text-muted-foreground">
                      {isLive ? "Live podcast episode" : "Regular episode"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-primary">
                      <Crown className="h-4 w-4" />
                      <Label htmlFor="isPremium" className="font-medium cursor-pointer">
                        Latest Talks+ Exclusive
                      </Label>
                    </div>
                    <Switch
                      id="isPremium"
                      checked={isPremium}
                      onCheckedChange={(checked) => {
                        setIsPremium(checked);
                        if (!checked) setIsPremiumReleased(false);
                      }}
                      data-testid="switch-premium"
                    />
                    <span className="text-sm text-muted-foreground">
                      {isPremium ? "Premium members only" : "Available to all"}
                    </span>
                  </div>
                  
                  {isPremium && (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <Sparkles className="h-4 w-4" />
                          <Label htmlFor="isPremiumReleased" className="font-medium cursor-pointer">
                            Release to Public
                          </Label>
                        </div>
                        <Switch
                          id="isPremiumReleased"
                          checked={isPremiumReleased}
                          onCheckedChange={setIsPremiumReleased}
                          data-testid="switch-premium-released"
                        />
                        <span className="text-sm text-muted-foreground">
                          {isPremiumReleased ? "Now available to everyone (LT+ Released)" : "Still exclusive to members"}
                        </span>
                      </div>
                      
                      <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-2 text-blue-700 mb-2">
                          <Video className="h-4 w-4" />
                          <Label className="font-medium">
                            Upload Video File (Optional)
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload a video file to bypass YouTube's paywall for released premium content. This video will play directly on the site.
                        </p>
                        {videoFileUrl ? (
                          <div className="flex items-center gap-3 p-2 bg-white rounded border">
                            {videoThumbnail ? (
                              <img 
                                src={videoThumbnail} 
                                alt="Video thumbnail" 
                                className="h-16 w-24 rounded object-cover border shadow-sm flex-shrink-0"
                              />
                            ) : (
                              <div className="h-16 w-24 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Video className="h-6 w-6 text-blue-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm truncate block">{videoFileUrl.split('/').pop()}</span>
                              <span className="text-xs text-muted-foreground">Video uploaded</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => { setVideoFileUrl(null); setVideoThumbnail(null); }}
                              data-testid="button-remove-video"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <ObjectUploader
                            maxFileSize={500 * 1024 * 1024}
                            allowedFileTypes={["video/*"]}
                            onGetUploadParameters={async () => {
                              const res = await fetch("/api/objects/upload", { method: "POST" });
                              const data = await res.json();
                              return { method: "PUT" as const, url: data.uploadURL };
                            }}
                            onComplete={(result) => {
                              if (result.successful?.[0]) {
                                const uploadedFile = result.successful[0];
                                const uploadURL = uploadedFile.uploadURL;
                                if (uploadURL) {
                                  const url = new URL(uploadURL);
                                  setVideoFileUrl(url.pathname);
                                  
                                  const videoEl = document.createElement('video');
                                  videoEl.crossOrigin = 'anonymous';
                                  videoEl.src = uploadURL;
                                  videoEl.currentTime = 1;
                                  videoEl.addEventListener('loadeddata', () => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = videoEl.videoWidth;
                                    canvas.height = videoEl.videoHeight;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                                      setVideoThumbnail(canvas.toDataURL('image/jpeg', 0.8));
                                    }
                                  });
                                }
                              }
                            }}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Upload Video File
                          </ObjectUploader>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {editingEpisode && (
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Episode Sponsors
                    </Label>
                    
                    {episodeSponsors && episodeSponsors.length > 0 && (
                      <div className="space-y-2">
                        {episodeSponsors.map((es) => (
                          <div 
                            key={es.id} 
                            className="flex items-center justify-between p-2 bg-white rounded border"
                            data-testid={`sponsor-link-${es.id}`}
                          >
                            <div className="flex items-center gap-3">
                              {es.sponsor?.logoUrl ? (
                                <img 
                                  src={es.sponsor.logoUrl} 
                                  alt={es.sponsor.name} 
                                  className="w-10 h-10 object-contain rounded"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-sm">{es.sponsor?.name || 'Unknown'}</span>
                                {es.promoCode && (
                                  <span className="block text-xs text-muted-foreground">Code: {es.promoCode}</span>
                                )}
                                {es.adText && (
                                  <span className="block text-xs text-muted-foreground truncate max-w-xs">{es.adText}</span>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="sponsor-remove-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeSponsorMutation.mutate(es.id);
                              }}
                              disabled={removeSponsorMutation.isPending}
                              data-testid={`button-remove-sponsor-${es.id}`}
                              aria-label={`Remove ${es.sponsor?.name || 'sponsor'}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Select value={selectedSponsorId} onValueChange={setSelectedSponsorId}>
                        <SelectTrigger data-testid="select-sponsor">
                          <SelectValue placeholder="Select sponsor to add..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sponsors?.filter(s => !episodeSponsors?.some(es => es.sponsorId === s.id)).map((sponsor) => (
                            <SelectItem key={sponsor.id} value={sponsor.id}>
                              {sponsor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedSponsorId && (
                        <div className="space-y-2 p-3 bg-white rounded border">
                          <Input
                            placeholder="Ad text (optional)"
                            value={sponsorAdText}
                            onChange={(e) => setSponsorAdText(e.target.value)}
                            data-testid="input-sponsor-adtext"
                          />
                          <Input
                            placeholder="Promo code (optional)"
                            value={sponsorPromoCode}
                            onChange={(e) => setSponsorPromoCode(e.target.value)}
                            data-testid="input-sponsor-promocode"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (selectedSponsorId && editingEpisode) {
                                addSponsorMutation.mutate({
                                  episodeId: editingEpisode.id,
                                  sponsorId: selectedSponsorId,
                                  adText: sponsorAdText || undefined,
                                  promoCode: sponsorPromoCode || undefined,
                                });
                              }
                            }}
                            disabled={addSponsorMutation.isPending}
                            data-testid="button-add-sponsor"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Link Sponsor
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-episode"
                  >
                    {editingEpisode ? "Update" : "Create"} Episode
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search episodes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>LT+</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEpisodes?.map((episode) => (
                    <TableRow key={episode.id} data-testid={`row-episode-${episode.id}`}>
                      <TableCell className="font-medium">{episode.episodeNumber}</TableCell>
                      <TableCell className="max-w-xs">
                        <Link 
                          href={`/episode/${episode.id}`}
                          className="flex items-center gap-1 text-[#10213A] hover:text-[#DE2026] hover:underline transition-colors group"
                          data-testid={`link-episode-${episode.id}`}
                        >
                          <span className="truncate">{episode.title}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </Link>
                      </TableCell>
                      <TableCell>{(episode as any).guest?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {episode.computedLabel && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  className={
                                    episode.computedLabel === "Trending Now" 
                                      ? "bg-orange-500 text-white border-orange-600 text-xs"
                                      : episode.computedLabel === "New Release"
                                      ? "bg-green-500 text-white border-green-600 text-xs"
                                      : "bg-purple-500 text-white border-purple-600 text-xs"
                                  }
                                >
                                  {episode.computedLabel === "Trending Now" && <TrendingUp className="h-3 w-3 mr-1" />}
                                  {episode.computedLabel === "New Release" && <Sparkles className="h-3 w-3 mr-1" />}
                                  {episode.computedLabel === "Most Popular" && <Star className="h-3 w-3 mr-1" />}
                                  {episode.computedLabel}
                                  <Zap className="h-2.5 w-2.5 ml-1" />
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Auto-assigned based on {episode.computedLabel === "Trending Now" ? "recent views" : episode.computedLabel === "New Release" ? "publish date" : "total views"}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {episode.label && episode.label !== "none" && (
                            <Badge variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {EPISODE_LABELS.find(l => l.value === episode.label)?.label || episode.label}
                            </Badge>
                          )}
                          {!episode.computedLabel && (!episode.label || episode.label === "none") && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={episode.status === "published" ? "default" : "secondary"}>
                          {episode.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {episode.isPremium && (
                          <div className="flex flex-col gap-1">
                            {episode.isPremiumReleased ? (
                              <Badge className="bg-green-600 text-white border-green-700">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Released
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-primary border-primary">
                                <Crown className="h-3 w-3 mr-1" />
                                Exclusive
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {(episode.viewCount || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {whatsappStatus?.configured && episode.status === "published" && (
                            <Popover 
                              open={whatsappEpisodeId === episode.id} 
                              onOpenChange={(open) => {
                                if (open) {
                                  setWhatsappEpisodeId(episode.id);
                                } else {
                                  setWhatsappEpisodeId(null);
                                  setSelectedTemplate("");
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  data-testid={`button-whatsapp-${episode.id}`}
                                  title="Share to WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72" align="end">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <MessageCircle className="h-4 w-4 text-green-600" />
                                    Broadcast to WhatsApp
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Send this episode to {whatsappStats?.activeContacts || 0} subscribers
                                  </p>
                                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                    <SelectTrigger data-testid="select-whatsapp-template">
                                      <SelectValue placeholder="Select template..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {whatsappTemplates?.map((t) => (
                                        <SelectItem key={t.id} value={t.name}>
                                          {t.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {(!whatsappTemplates || whatsappTemplates.length === 0) && (
                                    <p className="text-xs text-amber-600">
                                      No templates configured. Add templates in WhatsApp settings.
                                    </p>
                                  )}
                                  <Button
                                    className="w-full"
                                    size="sm"
                                    disabled={!selectedTemplate || whatsappBroadcastMutation.isPending}
                                    onClick={() => {
                                      if (selectedTemplate && whatsappEpisodeId) {
                                        whatsappBroadcastMutation.mutate({
                                          episodeId: whatsappEpisodeId,
                                          templateName: selectedTemplate
                                        });
                                      }
                                    }}
                                    data-testid="button-confirm-whatsapp"
                                  >
                                    {whatsappBroadcastMutation.isPending ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Broadcast
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(episode)}
                            data-testid={`button-edit-${episode.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this episode?")) {
                                deleteMutation.mutate(episode.id);
                              }
                            }}
                            data-testid={`button-delete-${episode.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
