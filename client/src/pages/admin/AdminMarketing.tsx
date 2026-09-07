import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { Link } from "wouter";
import {
  Mail,
  Send,
  Users,
  DollarSign,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MailOpen,
  Target,
  ChevronRight,
} from "lucide-react";
import type { Episode, Sponsor, EmailNotification, MarketingSettings, UpcomingEpisodeInfo, Guest } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Calendar, UserCheck, Video, Upload, X } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface MarketingStats {
  subscriberCount: number;
  sponsorCount: number;
  totalEmailsSent: number;
  pendingNotifications: number;
  totalSponsorViews: number;
}

interface SponsorMetric {
  id: string;
  sponsorId: string;
  sponsorName: string;
  sponsorEmail: string | null;
  totalViews: number;
  lastMilestone: number;
}

export default function AdminMarketing() {
  const { toast } = useToast();
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [selectedSponsor, setSelectedSponsor] = useState<string>("");
  const [milestone, setMilestone] = useState<string>("1000");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  
  // Upcoming Episode Form State
  const [upcomingTitle, setUpcomingTitle] = useState("");
  const [upcomingGuestName, setUpcomingGuestName] = useState("");
  const [upcomingGuestImageUrl, setUpcomingGuestImageUrl] = useState("");
  const [upcomingThumbnailUrl, setUpcomingThumbnailUrl] = useState("");
  const [upcomingTopic, setUpcomingTopic] = useState("");
  const [upcomingReleaseDate, setUpcomingReleaseDate] = useState("");
  const [upcomingIsActive, setUpcomingIsActive] = useState(true);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");

  const { data: stats, isLoading: loadingStats } = useQuery<MarketingStats>({
    queryKey: ["/api/marketing/stats"],
  });

  const { data: settings, isLoading: loadingSettings } = useQuery<MarketingSettings>({
    queryKey: ["/api/marketing/settings"],
  });

  const { data: notifications, isLoading: loadingNotifications } = useQuery<EmailNotification[]>({
    queryKey: ["/api/marketing/notifications"],
  });

  const { data: episodes, isLoading: loadingEpisodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: sponsors, isLoading: loadingSponsors } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const { data: guests } = useQuery<Guest[]>({
    queryKey: ["/api/guests"],
  });

  const { data: sponsorMetrics } = useQuery<SponsorMetric[]>({
    queryKey: ["/api/marketing/sponsor-metrics"],
  });

  const { data: upcomingEpisodeInfo, isLoading: loadingUpcoming } = useQuery<UpcomingEpisodeInfo | null>({
    queryKey: ["/api/upcoming-episode"],
  });

  // Load existing upcoming episode info into form
  useEffect(() => {
    if (upcomingEpisodeInfo) {
      setUpcomingTitle(upcomingEpisodeInfo.title || "Upcoming Episode");
      setUpcomingGuestName(upcomingEpisodeInfo.guestName || "");
      setUpcomingGuestImageUrl(upcomingEpisodeInfo.guestImageUrl || "");
      setUpcomingThumbnailUrl(upcomingEpisodeInfo.thumbnailUrl || "");
      setUpcomingTopic(upcomingEpisodeInfo.topic || "");
      setUpcomingReleaseDate(upcomingEpisodeInfo.releaseDate || "");
      setUpcomingIsActive(upcomingEpisodeInfo.isActive ?? true);
    }
  }, [upcomingEpisodeInfo]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<MarketingSettings>) => {
      const res = await apiRequest("PATCH", "/api/marketing/settings", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings"] });
      toast({ title: "Settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const updateUpcomingEpisodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/upcoming-episode", {
        title: upcomingTitle || "Upcoming Episode",
        guestName: upcomingGuestName,
        guestImageUrl: upcomingGuestImageUrl || null,
        thumbnailUrl: upcomingThumbnailUrl || null,
        topic: upcomingTopic,
        releaseDate: upcomingReleaseDate,
        isActive: upcomingIsActive,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upcoming-episode"] });
      toast({ title: "Upcoming episode info updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update upcoming episode info", variant: "destructive" });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleThumbnailUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      if (uploadURL) {
        setUpcomingThumbnailUrl(uploadURL);
        toast({ title: "Thumbnail uploaded successfully" });
      }
    }
  };

  const handleGuestImageUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      if (uploadURL) {
        setUpcomingGuestImageUrl(uploadURL);
        toast({ title: "Guest photo uploaded successfully" });
      }
    }
  };

  const sendEpisodeNotificationMutation = useMutation({
    mutationFn: async (episodeId: string) => {
      const res = await apiRequest("POST", "/api/marketing/send-episode-notification", { episodeId });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/stats"] });
      toast({ title: `Email sent to ${data.sent} subscribers` });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send notification", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const sendMilestoneNotificationMutation = useMutation({
    mutationFn: async ({ sponsorId, milestone }: { sponsorId: string; milestone: number }) => {
      const res = await apiRequest("POST", "/api/marketing/send-milestone-notification", { sponsorId, milestone });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/sponsor-metrics"] });
      toast({ title: "Milestone notification sent" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send notification", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const previewEmailMutation = useMutation({
    mutationFn: async (params: { type: string; episodeId?: string; sponsorId?: string; milestone?: number }) => {
      const res = await apiRequest("POST", "/api/marketing/preview-email", params);
      return res.json();
    },
    onSuccess: (data: any) => {
      setPreviewHtml(data.html);
      setShowPreview(true);
    },
    onError: () => {
      toast({ title: "Failed to generate preview", variant: "destructive" });
    },
  });

  const publishedEpisodes = episodes?.filter(e => e.status === "published") || [];
  const recentNotifications = notifications?.slice(0, 10) || [];

  // Get episodes featuring selected guest
  const selectedGuest = guests?.find(g => g.id === selectedGuestId);
  const guestEpisodes = episodes?.filter(e => 
    e.guestId === selectedGuestId || 
    e.guestName?.toLowerCase() === selectedGuest?.name?.toLowerCase()
  ) || [];

  const handleGuestSelect = (guestId: string) => {
    if (guestId === "new") {
      setSelectedGuestId("");
      return;
    }
    setSelectedGuestId(guestId);
    const guest = guests?.find(g => g.id === guestId);
    if (guest) {
      setUpcomingGuestName(guest.name);
      if (guest.imageUrl) setUpcomingGuestImageUrl(guest.imageUrl);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case "sending":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />Sending</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-marketing-title">Marketing Center</h1>
          <p className="text-muted-foreground">Email automation for subscribers and sponsors</p>
        </div>

        {/* Upcoming Episode - Advertise Section */}
        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              Upcoming Episode (Advertise Section)
            </CardTitle>
            <CardDescription>
              This info appears on the homepage to promote your next episode and attract sponsors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Guest Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                Select Existing Guest (Optional)
              </Label>
              <Select value={selectedGuestId} onValueChange={handleGuestSelect}>
                <SelectTrigger data-testid="select-existing-guest">
                  <SelectValue placeholder="Choose a guest to auto-fill their info..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">-- Enter New Guest --</SelectItem>
                  {guests?.map((guest) => (
                    <SelectItem key={guest.id} value={guest.id}>
                      {guest.name} {guest.title ? `(${guest.title})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGuest && guestEpisodes.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4" />
                    Previous Episodes with {selectedGuest.name}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {guestEpisodes.map((ep) => (
                      <Link key={ep.id} href={`/episode/${ep.id}`}>
                        <Badge 
                          variant="outline" 
                          className="bg-white dark:bg-blue-900/50 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/50"
                        >
                          #{ep.episodeNumber} - {ep.title?.substring(0, 30)}{(ep.title?.length || 0) > 30 ? "..." : ""}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="upcomingGuestName">Guest Name</Label>
                <Input
                  id="upcomingGuestName"
                  placeholder="e.g., Rabbi David Goldstein"
                  value={upcomingGuestName}
                  onChange={(e) => setUpcomingGuestName(e.target.value)}
                  data-testid="input-upcoming-guest"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upcomingReleaseDate">Release Date</Label>
                <Input
                  id="upcomingReleaseDate"
                  placeholder="e.g., December 15, 2025"
                  value={upcomingReleaseDate}
                  onChange={(e) => setUpcomingReleaseDate(e.target.value)}
                  data-testid="input-upcoming-date"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Episode Thumbnail</Label>
                <div className="flex gap-3 items-center">
                  {upcomingThumbnailUrl ? (
                    <div className="relative">
                      <img 
                        src={upcomingThumbnailUrl} 
                        alt="Thumbnail preview" 
                        className="h-16 w-24 rounded object-cover border border-blue-300 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><rect fill="%23f0f0f0" width="100" height="70"/><text x="50%" y="55%" text-anchor="middle" fill="%23999" font-size="10">No Image</text></svg>';
                        }}
                      />
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5"
                        onClick={() => setUpcomingThumbnailUrl("")}
                        data-testid="button-remove-thumbnail"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-16 w-24 rounded bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <ObjectUploader
                      maxFileSize={10485760}
                      allowedFileTypes={["image/*"]}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleThumbnailUploadComplete}
                      buttonClassName="h-8"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Thumbnail
                    </ObjectUploader>
                    <p className="text-xs text-muted-foreground">Shown in advertise strip</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Guest Photo</Label>
                <div className="flex gap-3 items-center">
                  {upcomingGuestImageUrl ? (
                    <div className="relative">
                      <img 
                        src={upcomingGuestImageUrl} 
                        alt="Guest preview" 
                        className="h-16 w-16 rounded-full object-cover border-2 border-blue-300 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="55%" text-anchor="middle" fill="%23999" font-size="10">No Image</text></svg>';
                        }}
                      />
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5"
                        onClick={() => setUpcomingGuestImageUrl("")}
                        data-testid="button-remove-guest-image"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <UserCheck className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <ObjectUploader
                      maxFileSize={10485760}
                      allowedFileTypes={["image/*"]}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleGuestImageUploadComplete}
                      buttonClassName="h-8"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </ObjectUploader>
                    <p className="text-xs text-muted-foreground">Fallback if no thumbnail</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upcomingTopic">Topic / Description</Label>
              <Textarea
                id="upcomingTopic"
                placeholder="What will be discussed in this episode?"
                value={upcomingTopic}
                onChange={(e) => setUpcomingTopic(e.target.value)}
                rows={2}
                data-testid="input-upcoming-topic"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  id="upcomingActive"
                  checked={upcomingIsActive}
                  onCheckedChange={setUpcomingIsActive}
                  data-testid="switch-upcoming-active"
                />
                <Label htmlFor="upcomingActive" className="cursor-pointer">
                  Show on homepage
                </Label>
              </div>
              <Button
                onClick={() => updateUpcomingEpisodeMutation.mutate()}
                disabled={updateUpcomingEpisodeMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-save-upcoming"
              >
                {updateUpcomingEpisodeMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Link href="/admin/subscribers">
            <Card className="cursor-pointer hover-elevate transition-all group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground group-hover:text-[#DE2026] transition-colors" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.subscriberCount || 0}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      Active subscribers
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/sponsors">
            <Card className="cursor-pointer hover-elevate transition-all group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Sponsors</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-[#DE2026] transition-colors" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.sponsorCount || 0}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      Active sponsors
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>

          <Card className="hover-elevate transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalEmailsSent || 0}</div>
                  <p className="text-xs text-muted-foreground">Total sent</p>
                </>
              )}
            </CardContent>
          </Card>

          <Link href="/admin/sponsors">
            <Card className="cursor-pointer hover-elevate transition-all group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">Sponsor Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground group-hover:text-[#DE2026] transition-colors" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{(stats?.totalSponsorViews || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      Tracked views
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>

          <Card className="hover-elevate transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.pendingNotifications || 0}</div>
                  <p className="text-xs text-muted-foreground">In queue</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailOpen className="h-5 w-5" />
                New Episode Notification
              </CardTitle>
              <CardDescription>
                Send email to all subscribers about a new episode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Episode</Label>
                <Select value={selectedEpisode} onValueChange={setSelectedEpisode}>
                  <SelectTrigger data-testid="select-episode">
                    <SelectValue placeholder="Choose an episode..." />
                  </SelectTrigger>
                  <SelectContent>
                    {publishedEpisodes.map((ep) => (
                      <SelectItem key={ep.id} value={ep.id}>
                        #{ep.episodeNumber} - {ep.title.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!selectedEpisode || previewEmailMutation.isPending}
                  onClick={() => previewEmailMutation.mutate({ type: "new-episode", episodeId: selectedEpisode })}
                  data-testid="button-preview-episode-email"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  disabled={!selectedEpisode || sendEpisodeNotificationMutation.isPending}
                  onClick={() => sendEpisodeNotificationMutation.mutate(selectedEpisode)}
                  data-testid="button-send-episode-notification"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendEpisodeNotificationMutation.isPending ? "Sending..." : "Send to All Subscribers"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Sponsor Milestone Notification
              </CardTitle>
              <CardDescription>
                Send milestone achievement email to a sponsor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Sponsor</Label>
                  <Select value={selectedSponsor} onValueChange={setSelectedSponsor}>
                    <SelectTrigger data-testid="select-sponsor">
                      <SelectValue placeholder="Choose sponsor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sponsors?.filter(s => s.contactEmail).map((sp) => (
                        <SelectItem key={sp.id} value={sp.id}>
                          {sp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Milestone</Label>
                  <Select value={milestone} onValueChange={setMilestone}>
                    <SelectTrigger data-testid="select-milestone">
                      <SelectValue placeholder="Views..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1,000 views</SelectItem>
                      <SelectItem value="5000">5,000 views</SelectItem>
                      <SelectItem value="10000">10,000 views</SelectItem>
                      <SelectItem value="25000">25,000 views</SelectItem>
                      <SelectItem value="50000">50,000 views</SelectItem>
                      <SelectItem value="100000">100,000 views</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!selectedSponsor || previewEmailMutation.isPending}
                  onClick={() => previewEmailMutation.mutate({ 
                    type: "sponsor-milestone", 
                    sponsorId: selectedSponsor,
                    milestone: parseInt(milestone),
                  })}
                  data-testid="button-preview-milestone-email"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  disabled={!selectedSponsor || sendMilestoneNotificationMutation.isPending}
                  onClick={() => sendMilestoneNotificationMutation.mutate({ 
                    sponsorId: selectedSponsor, 
                    milestone: parseInt(milestone),
                  })}
                  data-testid="button-send-milestone-notification"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendMilestoneNotificationMutation.isPending ? "Sending..." : "Send Milestone Email"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Automation Settings
            </CardTitle>
            <CardDescription>
              Configure automatic email triggers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingSettings ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newEpisodeEnabled">New Episode Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically notify subscribers when new episodes are published
                    </p>
                  </div>
                  <Switch
                    id="newEpisodeEnabled"
                    checked={settings?.newEpisodeEnabled ?? true}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ newEpisodeEnabled: checked })}
                    disabled={updateSettingsMutation.isPending}
                    data-testid="switch-episode-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sponsorMilestoneEnabled">Sponsor Milestone Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically email sponsors when they reach view milestones (every 1,000 views)
                    </p>
                  </div>
                  <Switch
                    id="sponsorMilestoneEnabled"
                    checked={settings?.sponsorMilestoneEnabled ?? true}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ sponsorMilestoneEnabled: checked })}
                    disabled={updateSettingsMutation.isPending}
                    data-testid="switch-milestone-notifications"
                  />
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Email sending requires a Resend API key to be configured. 
                    Without it, emails will be logged but not sent.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingNotifications ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentNotifications.length > 0 ? (
                <div className="space-y-3">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notification.subject}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{notification.type === "new-episode" ? "Episode" : "Milestone"}</span>
                          <span>|</span>
                          <span>{formatDate(notification.triggeredAt)}</span>
                          {(notification.sentCount ?? 0) > 0 && (
                            <>
                              <span>|</span>
                              <span>{notification.sentCount} sent</span>
                            </>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(notification.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No notifications sent yet
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Sponsor View Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sponsorMetrics && sponsorMetrics.length > 0 ? (
                <div className="space-y-3">
                  {sponsorMetrics.slice(0, 6).map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{metric.sponsorName}</p>
                        <p className="text-xs text-muted-foreground">
                          Last milestone: {(metric.lastMilestone || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{(metric.totalViews || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No sponsor metrics tracked yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              This is how the email will appear to recipients
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[500px] bg-white"
              title="Email Preview"
              data-testid="iframe-email-preview"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
