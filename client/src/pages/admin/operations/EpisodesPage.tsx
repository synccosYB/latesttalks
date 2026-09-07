import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Video,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  Mic,
  Film,
  Utensils,
  Scissors,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";
import type { Episode, EpisodeAdSlot, EpisodeCost, Sponsor, TeamMember } from "@shared/schema";

const AD_SLOT_TYPES = [
  { type: "prime_time", name: "Prime Time", defaultRate: 2500 },
  { type: "ad_break_1", name: "Ad Break 1", defaultRate: 1500 },
  { type: "ad_break_2", name: "Ad Break 2", defaultRate: 1000 },
];

const COST_TYPES = [
  { type: "host", name: "Host", icon: Mic },
  { type: "sound_engineer", name: "Sound Engineer", icon: Mic },
  { type: "video_editor", name: "Video Editor", icon: Film },
  { type: "food", name: "Food/Refreshments", icon: Utensils },
  { type: "shorts", name: "Shorts/Clips", icon: Scissors },
  { type: "add_on", name: "Add-On", icon: Plus },
  { type: "other", name: "Other", icon: MoreHorizontal },
];

export default function EpisodesPage() {
  const { toast } = useToast();
  const [expandedEpisode, setExpandedEpisode] = useState<string | null>(null);
  const [adSlotDialogOpen, setAdSlotDialogOpen] = useState(false);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [editingAdSlot, setEditingAdSlot] = useState<EpisodeAdSlot | null>(null);
  const [editingCost, setEditingCost] = useState<EpisodeCost | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"adSlot" | "cost">("adSlot");
  const [deleteId, setDeleteId] = useState<string>("");

  const [adSlotForm, setAdSlotForm] = useState({
    slotType: "",
    slotIndex: 1,
    rate: 0,
    sponsorId: "",
    sponsorName: "",
    bookingStatus: "available",
    notes: "",
  });

  const [costForm, setCostForm] = useState({
    costType: "",
    teamMemberId: "",
    vendorName: "",
    description: "",
    amount: 0,
    paid: false,
    notes: "",
  });

  const { data: episodes = [], isLoading: loadingEpisodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: sponsors = [] } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const publishedEpisodes = episodes.filter(e => e.status === "published").sort((a, b) => 
    (b.episodeNumber || 0) - (a.episodeNumber || 0)
  );

  const createAdSlot = useMutation({
    mutationFn: async (data: typeof adSlotForm & { episodeId: string }) => {
      return apiRequest("POST", "/api/episode-ad-slots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", selectedEpisodeId, "ad-slots"] });
      toast({ title: "Ad slot created" });
      setAdSlotDialogOpen(false);
      resetAdSlotForm();
    },
    onError: () => {
      toast({ title: "Failed to create ad slot", variant: "destructive" });
    },
  });

  const updateAdSlot = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EpisodeAdSlot> & { id: string }) => {
      return apiRequest("PATCH", `/api/episode-ad-slots/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", selectedEpisodeId, "ad-slots"] });
      toast({ title: "Ad slot updated" });
      setAdSlotDialogOpen(false);
      resetAdSlotForm();
    },
    onError: () => {
      toast({ title: "Failed to update ad slot", variant: "destructive" });
    },
  });

  const deleteAdSlot = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/episode-ad-slots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", selectedEpisodeId, "ad-slots"] });
      toast({ title: "Ad slot deleted" });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to delete ad slot", variant: "destructive" });
    },
  });

  const createCost = useMutation({
    mutationFn: async (data: typeof costForm & { episodeId: string }) => {
      return apiRequest("POST", "/api/episode-costs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", selectedEpisodeId, "costs"] });
      toast({ title: "Cost added" });
      setCostDialogOpen(false);
      resetCostForm();
    },
    onError: () => {
      toast({ title: "Failed to add cost", variant: "destructive" });
    },
  });

  const updateCost = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EpisodeCost> & { id: string }) => {
      return apiRequest("PATCH", `/api/episode-costs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", selectedEpisodeId, "costs"] });
      toast({ title: "Cost updated" });
      setCostDialogOpen(false);
      resetCostForm();
    },
    onError: () => {
      toast({ title: "Failed to update cost", variant: "destructive" });
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/episode-costs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes", selectedEpisodeId, "costs"] });
      toast({ title: "Cost deleted" });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to delete cost", variant: "destructive" });
    },
  });

  const resetAdSlotForm = () => {
    setAdSlotForm({
      slotType: "",
      slotIndex: 1,
      rate: 0,
      sponsorId: "",
      sponsorName: "",
      bookingStatus: "available",
      notes: "",
    });
    setEditingAdSlot(null);
  };

  const resetCostForm = () => {
    setCostForm({
      costType: "",
      teamMemberId: "",
      vendorName: "",
      description: "",
      amount: 0,
      paid: false,
      notes: "",
    });
    setEditingCost(null);
  };

  const openAdSlotDialog = (episodeId: string, slot?: EpisodeAdSlot) => {
    setSelectedEpisodeId(episodeId);
    if (slot) {
      setEditingAdSlot(slot);
      setAdSlotForm({
        slotType: slot.slotType,
        slotIndex: slot.slotIndex,
        rate: slot.rate || 0,
        sponsorId: slot.sponsorId || "",
        sponsorName: slot.sponsorName || "",
        bookingStatus: slot.bookingStatus || "available",
        notes: slot.notes || "",
      });
    } else {
      resetAdSlotForm();
    }
    setAdSlotDialogOpen(true);
  };

  const openCostDialog = (episodeId: string, cost?: EpisodeCost) => {
    setSelectedEpisodeId(episodeId);
    if (cost) {
      setEditingCost(cost);
      setCostForm({
        costType: cost.costType,
        teamMemberId: cost.teamMemberId || "",
        vendorName: cost.vendorName || "",
        description: cost.description || "",
        amount: cost.amount,
        paid: cost.paid || false,
        notes: cost.notes || "",
      });
    } else {
      resetCostForm();
    }
    setCostDialogOpen(true);
  };

  const confirmDelete = (type: "adSlot" | "cost", id: string, episodeId: string) => {
    setDeleteType(type);
    setDeleteId(id);
    setSelectedEpisodeId(episodeId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteType === "adSlot") {
      deleteAdSlot.mutate(deleteId);
    } else {
      deleteCost.mutate(deleteId);
    }
  };

  const handleAdSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEpisodeId) return;
    
    if (editingAdSlot) {
      updateAdSlot.mutate({ id: editingAdSlot.id, ...adSlotForm });
    } else {
      createAdSlot.mutate({ episodeId: selectedEpisodeId, ...adSlotForm });
    }
  };

  const handleCostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEpisodeId) return;
    
    if (editingCost) {
      updateCost.mutate({ id: editingCost.id, ...costForm });
    } else {
      createCost.mutate({ episodeId: selectedEpisodeId, ...costForm });
    }
  };

  if (loadingEpisodes) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Episodes Operations</h1>
          <p className="text-muted-foreground">Manage ad slots and production costs for episodes</p>
        </div>

        {publishedEpisodes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No published episodes found. Publish some episodes first to manage their ad slots and costs.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {publishedEpisodes.map((episode) => (
              <EpisodeOperationsCard
                key={episode.id}
                episode={episode}
                sponsors={sponsors}
                teamMembers={teamMembers}
                isExpanded={expandedEpisode === episode.id}
                onToggle={() => setExpandedEpisode(expandedEpisode === episode.id ? null : episode.id)}
                onAddAdSlot={() => openAdSlotDialog(episode.id)}
                onEditAdSlot={(slot) => openAdSlotDialog(episode.id, slot)}
                onDeleteAdSlot={(id) => confirmDelete("adSlot", id, episode.id)}
                onAddCost={() => openCostDialog(episode.id)}
                onEditCost={(cost) => openCostDialog(episode.id, cost)}
                onDeleteCost={(id) => confirmDelete("cost", id, episode.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ad Slot Dialog */}
      <Dialog open={adSlotDialogOpen} onOpenChange={setAdSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAdSlot ? "Edit Ad Slot" : "Add Ad Slot"}</DialogTitle>
            <DialogDescription>
              {editingAdSlot ? "Update ad slot details" : "Add a new ad slot to this episode"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdSlotSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slot Type</Label>
                <Select 
                  value={adSlotForm.slotType} 
                  onValueChange={(value) => {
                    const slotType = AD_SLOT_TYPES.find(s => s.type === value);
                    setAdSlotForm({
                      ...adSlotForm,
                      slotType: value,
                      rate: slotType?.defaultRate || 0,
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-slot-type">
                    <SelectValue placeholder="Select slot type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_SLOT_TYPES.map((slot) => (
                      <SelectItem key={slot.type} value={slot.type}>
                        {slot.name} (${slot.defaultRate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Slot Number</Label>
                <Select 
                  value={adSlotForm.slotIndex.toString()} 
                  onValueChange={(value) => setAdSlotForm({ ...adSlotForm, slotIndex: parseInt(value) })}
                >
                  <SelectTrigger data-testid="select-slot-index">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Slot 1</SelectItem>
                    <SelectItem value="2">Slot 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rate ($)</Label>
              <Input
                type="number"
                value={adSlotForm.rate}
                onChange={(e) => setAdSlotForm({ ...adSlotForm, rate: parseInt(e.target.value) || 0 })}
                data-testid="input-rate"
              />
            </div>

            <div className="space-y-2">
              <Label>Sponsor</Label>
              <Select 
                value={adSlotForm.sponsorId} 
                onValueChange={(value) => {
                  const sponsor = sponsors.find(s => s.id === value);
                  setAdSlotForm({ 
                    ...adSlotForm, 
                    sponsorId: value,
                    sponsorName: sponsor?.name || "",
                  });
                }}
              >
                <SelectTrigger data-testid="select-sponsor">
                  <SelectValue placeholder="Select sponsor or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No sponsor yet</SelectItem>
                  {sponsors.map((sponsor) => (
                    <SelectItem key={sponsor.id} value={sponsor.id}>
                      {sponsor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!adSlotForm.sponsorId && (
              <div className="space-y-2">
                <Label>Or enter sponsor name manually</Label>
                <Input
                  value={adSlotForm.sponsorName}
                  onChange={(e) => setAdSlotForm({ ...adSlotForm, sponsorName: e.target.value })}
                  placeholder="Sponsor name"
                  data-testid="input-sponsor-name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Booking Status</Label>
              <Select 
                value={adSlotForm.bookingStatus} 
                onValueChange={(value) => setAdSlotForm({ ...adSlotForm, bookingStatus: value })}
              >
                <SelectTrigger data-testid="select-booking-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={adSlotForm.notes}
                onChange={(e) => setAdSlotForm({ ...adSlotForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                className="resize-none"
                data-testid="input-ad-notes"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdSlotDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAdSlot.isPending || updateAdSlot.isPending}>
                {editingAdSlot ? "Update" : "Add"} Slot
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cost Dialog */}
      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCost ? "Edit Cost" : "Add Production Cost"}</DialogTitle>
            <DialogDescription>
              {editingCost ? "Update cost details" : "Add a production cost to this episode"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCostSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cost Type</Label>
              <Select 
                value={costForm.costType} 
                onValueChange={(value) => setCostForm({ ...costForm, costType: value })}
              >
                <SelectTrigger data-testid="select-cost-type">
                  <SelectValue placeholder="Select cost type" />
                </SelectTrigger>
                <SelectContent>
                  {COST_TYPES.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team Member (optional)</Label>
              <Select 
                value={costForm.teamMemberId} 
                onValueChange={(value) => setCostForm({ ...costForm, teamMemberId: value })}
              >
                <SelectTrigger data-testid="select-team-member">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">External vendor</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!costForm.teamMemberId && (
              <div className="space-y-2">
                <Label>Vendor Name</Label>
                <Input
                  value={costForm.vendorName}
                  onChange={(e) => setCostForm({ ...costForm, vendorName: e.target.value })}
                  placeholder="External vendor name"
                  data-testid="input-vendor-name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={costForm.description}
                onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                placeholder="Brief description"
                data-testid="input-cost-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                value={costForm.amount}
                onChange={(e) => setCostForm({ ...costForm, amount: parseInt(e.target.value) || 0 })}
                required
                data-testid="input-cost-amount"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="paid"
                checked={costForm.paid}
                onChange={(e) => setCostForm({ ...costForm, paid: e.target.checked })}
                className="h-4 w-4"
                data-testid="checkbox-paid"
              />
              <Label htmlFor="paid">Already paid</Label>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={costForm.notes}
                onChange={(e) => setCostForm({ ...costForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                className="resize-none"
                data-testid="input-cost-notes"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCostDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCost.isPending || updateCost.isPending}>
                {editingCost ? "Update" : "Add"} Cost
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === "adSlot" ? "Ad Slot" : "Cost"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteType === "adSlot" ? "ad slot" : "cost"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteAdSlot.isPending || deleteCost.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

interface EpisodeOperationsCardProps {
  episode: Episode;
  sponsors: Sponsor[];
  teamMembers: TeamMember[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddAdSlot: () => void;
  onEditAdSlot: (slot: EpisodeAdSlot) => void;
  onDeleteAdSlot: (id: string) => void;
  onAddCost: () => void;
  onEditCost: (cost: EpisodeCost) => void;
  onDeleteCost: (id: string) => void;
}

function EpisodeOperationsCard({
  episode,
  sponsors,
  teamMembers,
  isExpanded,
  onToggle,
  onAddAdSlot,
  onEditAdSlot,
  onDeleteAdSlot,
  onAddCost,
  onEditCost,
  onDeleteCost,
}: EpisodeOperationsCardProps) {
  const { data: adSlotsData, isLoading: loadingSlots } = useQuery<EpisodeAdSlot[]>({
    queryKey: ["/api/episodes", episode.id, "ad-slots"],
    queryFn: () => fetch(`/api/episodes/${episode.id}/ad-slots`).then(res => res.json()),
    enabled: isExpanded,
  });

  const { data: costsData, isLoading: loadingCosts } = useQuery<EpisodeCost[]>({
    queryKey: ["/api/episodes", episode.id, "costs"],
    queryFn: () => fetch(`/api/episodes/${episode.id}/costs`).then(res => res.json()),
    enabled: isExpanded,
  });

  // Ensure adSlots and costs are always arrays
  const adSlots = Array.isArray(adSlotsData) ? adSlotsData : [];
  const costs = Array.isArray(costsData) ? costsData : [];

  const totalRevenue = adSlots.reduce((sum, slot) => sum + (slot.rate || 0), 0);
  const bookedSlots = adSlots.filter(s => s.bookingStatus !== "available").length;
  const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const netProfit = totalRevenue - totalCosts;

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "booked": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getSlotTypeName = (type: string) => {
    return AD_SLOT_TYPES.find(s => s.type === type)?.name || type;
  };

  const getCostTypeName = (type: string) => {
    return COST_TYPES.find(c => c.type === type)?.name || type;
  };

  return (
    <Card data-testid={`card-episode-${episode.id}`}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Video className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">
                    {episode.episodeNumber ? `Episode ${episode.episodeNumber}: ` : ""}{episode.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {episode.publishedAt ? format(new Date(episode.publishedAt), "PP") : "No date"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className={`text-sm font-semibold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${netProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bookedSlots}/{adSlots.length} slots • ${totalCosts} costs
                  </p>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-xs text-muted-foreground">Costs</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  ${totalCosts.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${netProfit >= 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-orange-50 dark:bg-orange-900/20"}`}>
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p className={`text-lg font-bold ${netProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>
                  ${netProfit.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Ad Slots Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Ad Slots
                </h4>
                <Button size="sm" onClick={onAddAdSlot} data-testid="button-add-slot">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Slot
                </Button>
              </div>
              {loadingSlots ? (
                <Skeleton className="h-20 w-full" />
              ) : adSlots.length > 0 ? (
                <div className="space-y-2">
                  {adSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`slot-${slot.id}`}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {getSlotTypeName(slot.slotType)} - Slot {slot.slotIndex}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot.sponsorName || slot.sponsorId 
                            ? `Sponsor: ${slot.sponsorName || sponsors.find(s => s.id === slot.sponsorId)?.name || "Unknown"}`
                            : "No sponsor assigned"
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${(slot.rate || 0).toLocaleString()}</span>
                        <Badge className={getBookingStatusColor(slot.bookingStatus || "available")} variant="secondary">
                          {slot.bookingStatus || "available"}
                        </Badge>
                        <Button size="icon" variant="ghost" onClick={() => onEditAdSlot(slot)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDeleteAdSlot(slot.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No ad slots added yet</p>
              )}
            </div>

            {/* Costs Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Production Costs
                </h4>
                <Button size="sm" onClick={onAddCost} data-testid="button-add-cost">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Cost
                </Button>
              </div>
              {loadingCosts ? (
                <Skeleton className="h-20 w-full" />
              ) : costs.length > 0 ? (
                <div className="space-y-2">
                  {costs.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`cost-${cost.id}`}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {getCostTypeName(cost.costType)}
                          {cost.description && ` - ${cost.description}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cost.teamMemberId 
                            ? teamMembers.find(m => m.id === cost.teamMemberId)?.name || "Team Member"
                            : cost.vendorName || "Unknown"
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${cost.amount.toLocaleString()}</span>
                        {cost.paid ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Unpaid
                          </Badge>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => onEditCost(cost)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDeleteCost(cost.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No costs added yet</p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
