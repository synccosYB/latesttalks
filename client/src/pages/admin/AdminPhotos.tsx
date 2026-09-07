import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Trash2, Camera, Clock, CheckCircle, Plane, MapPin, Calendar, Video, EyeOff, Pencil } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { CommunityPhoto } from "@shared/schema";
import { format } from "date-fns";
import elAlLogo from "@assets/image_1764475161415.png";
import unitedLogo from "@assets/image_1764955422755.png";

const AIRLINES: Record<string, string> = {
  "elal": "El Al",
  "el-al": "El Al",
  "united": "United Airlines",
  "delta": "Delta Air Lines",
  "american": "American Airlines",
  "lufthansa": "Lufthansa",
  "british": "British Airways",
  "emirates": "Emirates",
  "turkish": "Turkish Airlines",
  "swiss": "Swiss International",
  "austrian": "Austrian Airlines",
  "jetblue": "JetBlue",
  "southwest": "Southwest Airlines",
  "alaska": "Alaska Airlines",
  "other": "Other Airline",
};

const AIRLINE_LOGOS: Record<string, string> = {
  elal: elAlLogo,
  "el-al": elAlLogo,
  united: unitedLogo,
};

const AIRLINE_COLORS: Record<string, { bg: string; text: string }> = {
  delta: { bg: "#C01933", text: "white" },
  american: { bg: "#0078D2", text: "white" },
  lufthansa: { bg: "#05164D", text: "#FFD700" },
  british: { bg: "#075AAA", text: "white" },
  emirates: { bg: "#D71920", text: "white" },
  turkish: { bg: "#C70A0C", text: "white" },
  swiss: { bg: "#E2001A", text: "white" },
  austrian: { bg: "#E20A17", text: "white" },
  jetblue: { bg: "#003876", text: "white" },
  southwest: { bg: "#304CB2", text: "white" },
  alaska: { bg: "#01426A", text: "white" },
  other: { bg: "#666666", text: "white" },
};

function AirlineLogo({ airline, className = "" }: { airline: string; className?: string }) {
  const logoSrc = AIRLINE_LOGOS[airline];
  
  if (logoSrc) {
    return (
      <div className={`flex items-center ${className}`}>
        <img src={logoSrc} alt={AIRLINES[airline] || airline} className="h-6 w-auto object-contain" />
      </div>
    );
  }

  const colors = AIRLINE_COLORS[airline] || AIRLINE_COLORS.other;
  const label = AIRLINES[airline] || airline;
  
  return (
    <div 
      className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <Plane className="w-3 h-3" />
      {label}
    </div>
  );
}

export default function AdminPhotos() {
  const [activeTab, setActiveTab] = useState("pending");
  const [editingPhoto, setEditingPhoto] = useState<CommunityPhoto | null>(null);
  const [editForm, setEditForm] = useState({
    caption: "",
    route: "",
    flightNumber: "",
    flightDate: "",
    airline: "",
    imageUrl: "",
    videoUrl: "",
    submitterName: "",
    submitterEmail: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: allPhotos, isLoading } = useQuery<CommunityPhoto[]>({
    queryKey: ["/api/community-photos"],
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/community-photos/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-photos"] });
      toast({ title: "Photo updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update photo", variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CommunityPhoto> }) => {
      const res = await apiRequest("PATCH", `/api/community-photos/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-photos"] });
      toast({ title: "Photo updated successfully" });
      setEditingPhoto(null);
    },
    onError: () => {
      toast({ title: "Failed to update photo", variant: "destructive" });
    },
  });

  const openEditDialog = (photo: CommunityPhoto) => {
    setEditForm({
      caption: photo.caption || "",
      route: photo.route || "",
      flightNumber: photo.flightNumber || "",
      flightDate: photo.flightDate || "",
      airline: photo.airline || "",
      imageUrl: photo.imageUrl || "",
      videoUrl: photo.videoUrl || "",
      submitterName: photo.submitterName || "",
      submitterEmail: photo.submitterEmail || "",
    });
    setEditingPhoto(photo);
  };

  const handleEditSubmit = () => {
    if (!editingPhoto) return;
    editMutation.mutate({
      id: editingPhoto.id,
      data: {
        caption: editForm.caption || undefined,
        route: editForm.route || undefined,
        flightNumber: editForm.flightNumber || undefined,
        flightDate: editForm.flightDate || undefined,
        airline: editForm.airline || undefined,
        imageUrl: editForm.imageUrl || undefined,
        videoUrl: editForm.videoUrl || undefined,
        submitterName: editForm.submitterName || undefined,
        submitterEmail: editForm.submitterEmail || undefined,
      },
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/community-photos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-photos"] });
      toast({ title: "Photo deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete photo", variant: "destructive" });
    },
  });

  const pendingPhotos = allPhotos?.filter((p) => p.status === "pending") || [];
  const approvedPhotos = allPhotos?.filter((p) => p.status === "approved") || [];
  const rejectedPhotos = allPhotos?.filter((p) => p.status === "rejected") || [];

  const getAirlineLabel = (airline?: string | null) => {
    if (!airline) return "Unknown Airline";
    return AIRLINES[airline] || airline;
  };

  const PhotoCard = ({ photo }: { photo: CommunityPhoto }) => (
    <Card className="overflow-hidden" data-testid={`card-photo-${photo.id}`}>
      <div className="aspect-video bg-muted relative">
        {photo.mediaType === "video" && photo.videoUrl ? (
          <>
            {/* Check if we have a valid thumbnail (not same as video URL) */}
            {photo.videoThumbnailUrl && photo.videoThumbnailUrl !== photo.videoUrl ? (
              <video
                src={photo.videoUrl}
                controls
                className="w-full h-full object-cover"
                poster={photo.videoThumbnailUrl}
              />
            ) : photo.imageUrl && photo.imageUrl !== photo.videoUrl ? (
              <video
                src={photo.videoUrl}
                controls
                className="w-full h-full object-cover"
                poster={photo.imageUrl}
              />
            ) : (
              /* No valid thumbnail - show video with gradient background */
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <video
                  src={photo.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </>
        ) : (
          <img
            src={photo.imageUrl}
            alt={photo.caption || "Community photo"}
            className="w-full h-full object-cover"
          />
        )}
        {photo.mediaType === "video" && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
            <Video className="h-3 w-3" />
            Video
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {photo.airline && (
                <AirlineLogo airline={photo.airline} />
              )}
              {photo.flightNumber && (
                <Badge variant="secondary" className="text-xs">
                  {photo.flightNumber}
                </Badge>
              )}
              {photo.isAnonymous && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                  <EyeOff className="w-3 h-3 mr-1" />
                  Anonymous
                </Badge>
              )}
            </div>
            {photo.route && (
              <p className="text-sm flex items-center gap-1 text-muted-foreground mb-1">
                <MapPin className="w-3 h-3" />
                {photo.route}
              </p>
            )}
            {photo.flightDate && (
              <p className="text-xs flex items-center gap-1 text-muted-foreground mb-2">
                <Calendar className="w-3 h-3" />
                {photo.flightDate}
              </p>
            )}
            {photo.caption && (
              <p className="text-sm text-muted-foreground mb-2">{photo.caption}</p>
            )}
            <div className="text-xs text-muted-foreground">
              {/* Admin always sees the name, even for anonymous submissions */}
              {photo.submitterName && (
                <span className={photo.isAnonymous ? "text-amber-600" : ""}>
                  By {photo.submitterName} {photo.isAnonymous && "(hidden publicly)"}
                </span>
              )}
              {photo.submitterEmail && <span className="ml-2">({photo.submitterEmail})</span>}
              {photo.createdAt && (
                <span className="ml-2">
                  · {format(new Date(photo.createdAt), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          {photo.status === "pending" && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => updateMutation.mutate({ id: photo.id, status: "approved" })}
                data-testid={`button-approve-${photo.id}`}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => updateMutation.mutate({ id: photo.id, status: "rejected" })}
                data-testid={`button-reject-${photo.id}`}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditDialog(photo)}
            data-testid={`button-edit-${photo.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm("Are you sure you want to delete this photo?")) {
                deleteMutation.mutate(photo.id);
              }
            }}
            data-testid={`button-delete-${photo.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Community Photos</h1>
          <p className="text-muted-foreground">Manage in-flight entertainment photos from the community</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setActiveTab("pending")}
            data-testid="card-pending-photos"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingPhotos.length}</div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setActiveTab("approved")}
            data-testid="card-approved-photos"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedPhotos.length}</div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setActiveTab("rejected")}
            data-testid="card-rejected-photos"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedPhotos.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingPhotos.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedPhotos.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedPhotos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : pendingPhotos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingPhotos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No pending photos to review</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            {approvedPhotos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {approvedPhotos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No approved photos</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            {rejectedPhotos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rejectedPhotos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No rejected photos</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingPhoto} onOpenChange={(open) => !open && setEditingPhoto(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-caption">Caption</Label>
                <Textarea
                  id="edit-caption"
                  value={editForm.caption}
                  onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  placeholder="Photo caption..."
                  className="min-h-20"
                  data-testid="input-edit-caption"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-route">Route</Label>
                <Input
                  id="edit-route"
                  value={editForm.route}
                  onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                  placeholder="e.g., TLV → JFK"
                  data-testid="input-edit-route"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-flightNumber">Flight Number</Label>
                <Input
                  id="edit-flightNumber"
                  value={editForm.flightNumber}
                  onChange={(e) => setEditForm({ ...editForm, flightNumber: e.target.value })}
                  placeholder="e.g., LY001"
                  data-testid="input-edit-flight-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-flightDate">Flight Date</Label>
                <Input
                  id="edit-flightDate"
                  value={editForm.flightDate}
                  onChange={(e) => setEditForm({ ...editForm, flightDate: e.target.value })}
                  placeholder="e.g., 2025-01-15"
                  data-testid="input-edit-flight-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-airline">Airline</Label>
                <Select
                  value={editForm.airline}
                  onValueChange={(value) => setEditForm({ ...editForm, airline: value })}
                >
                  <SelectTrigger id="edit-airline" data-testid="select-edit-airline">
                    <SelectValue placeholder="Select airline" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AIRLINES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                value={editForm.imageUrl}
                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-edit-image-url"
              />
            </div>
            {editingPhoto?.mediaType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="edit-videoUrl">Video URL</Label>
                <Input
                  id="edit-videoUrl"
                  value={editForm.videoUrl}
                  onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-edit-video-url"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-submitterName">Submitter Name</Label>
                <Input
                  id="edit-submitterName"
                  value={editForm.submitterName}
                  onChange={(e) => setEditForm({ ...editForm, submitterName: e.target.value })}
                  placeholder="Name"
                  data-testid="input-edit-submitter-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-submitterEmail">Submitter Email</Label>
                <Input
                  id="edit-submitterEmail"
                  value={editForm.submitterEmail}
                  onChange={(e) => setEditForm({ ...editForm, submitterEmail: e.target.value })}
                  placeholder="email@example.com"
                  data-testid="input-edit-submitter-email"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPhoto(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubmit}
              disabled={editMutation.isPending}
              data-testid="button-save-edit"
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
