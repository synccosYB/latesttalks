import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Star, Image, Eye, EyeOff, ChevronDown, ChevronRight, Play, ImagePlus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { MediaPickerDialog } from "@/components/admin/MediaPickerDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Guest, Episode } from "@shared/schema";

export default function AdminGuests() {
  const [search, setSearch] = useState("");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const { toast } = useToast();

  const { data: guests, isLoading } = useQuery<Guest[]>({
    queryKey: ["/api/guests"],
  });

  const { data: allEpisodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Guest>) => {
      const res = await apiRequest("POST", "/api/guests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setIsDialogOpen(false);
      toast({ title: "Guest created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create guest", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Guest> }) => {
      const res = await apiRequest("PATCH", `/api/guests/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setIsDialogOpen(false);
      setEditingGuest(null);
      toast({ title: "Guest updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update guest", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/guests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      toast({ title: "Guest deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete guest", variant: "destructive" });
    },
  });

  const filteredGuests = guests?.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.company?.toLowerCase().includes(search.toLowerCase())
  );

  const getGuestEpisodes = (guestId: string, guestName: string): Episode[] => {
    if (!allEpisodes) return [];
    return allEpisodes.filter(episode => 
      episode.guestId === guestId || 
      episode.guest2Id === guestId ||
      episode.guest3Id === guestId ||
      (episode.guestName?.toLowerCase().includes(guestName.toLowerCase())) ||
      (episode.guest2Name?.toLowerCase().includes(guestName.toLowerCase())) ||
      (episode.guest3Name?.toLowerCase().includes(guestName.toLowerCase()))
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      namePrefix: formData.get("namePrefix") as string || null,
      name: formData.get("name") as string,
      title: formData.get("title") as string || null,
      company: formData.get("company") as string || null,
      bio: bio || null,
      email: formData.get("email") as string || null,
      phone: phone || null,
      website: formData.get("website") as string || null,
      imageUrl: formData.get("imageUrl") as string || null,
      featured: isFeatured,
      status: isPublished ? "published" : "draft",
    };

    if (editingGuest) {
      updateMutation.mutate({ id: editingGuest.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (guest: Guest) => {
    setEditingGuest(guest);
    setIsFeatured(guest.featured || false);
    setIsPublished(guest.status === "published" || !guest.status);
    setImageUrl(guest.imageUrl || "");
    setPhone(guest.phone || "");
    setBio(guest.bio || "");
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingGuest(null);
    setIsFeatured(false);
    setIsPublished(true);
    setImageUrl("");
    setPhone("");
    setBio("");
    setIsDialogOpen(true);
  };

  const toggleGuestExpansion = (guestId: string) => {
    setExpandedGuestId(expandedGuestId === guestId ? null : guestId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Guests</h1>
            <p className="text-muted-foreground">Manage podcast guests</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-guest">
                <Plus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {editingGuest ? "Edit Guest" : "Add New Guest"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namePrefix">Prefix</Label>
                    <Input
                      id="namePrefix"
                      name="namePrefix"
                      defaultValue={editingGuest?.namePrefix || ""}
                      placeholder="R'"
                      data-testid="input-name-prefix"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingGuest?.name || ""}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title/Role</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingGuest?.title || ""}
                      data-testid="input-title"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    defaultValue={editingGuest?.company || ""}
                    data-testid="input-company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    Profile Image URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="flex-1"
                      data-testid="input-image-url"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMediaPicker(true)}
                      data-testid="button-select-from-library"
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Library
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a URL or select an existing image from your library
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <RichTextEditor
                    value={bio}
                    onChange={setBio}
                    placeholder="Enter guest bio..."
                    data-testid="input-bio"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingGuest?.email || ""}
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="phone-input-wrapper" data-testid="input-phone">
                      <PhoneInput
                        international
                        defaultCountry="US"
                        value={phone}
                        onChange={(value) => setPhone(value || "")}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    defaultValue={editingGuest?.website || ""}
                    placeholder="https://..."
                    data-testid="input-website"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="featured"
                      checked={isFeatured}
                      onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
                      data-testid="checkbox-featured"
                    />
                    <Label htmlFor="featured" className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Featured Guest
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="published"
                      checked={isPublished}
                      onCheckedChange={(checked) => setIsPublished(checked as boolean)}
                      data-testid="checkbox-published"
                    />
                    <Label htmlFor="published" className="flex items-center gap-1">
                      {isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      {isPublished ? "Published" : "Draft"}
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-guest"
                  >
                    {editingGuest ? "Update" : "Create"} Guest
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
                  placeholder="Search guests..."
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
              <div className="space-y-2">
                {filteredGuests?.map((guest) => {
                  const guestEpisodes = getGuestEpisodes(guest.id, guest.name);
                  const isExpanded = expandedGuestId === guest.id;
                  
                  return (
                    <Collapsible key={guest.id} open={isExpanded} onOpenChange={() => toggleGuestExpansion(guest.id)}>
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div 
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            data-testid={`row-guest-${guest.id}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </div>
                              {guest.imageUrl ? (
                                <img 
                                  src={guest.imageUrl} 
                                  alt={guest.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                                  {guest.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">
                                  {guest.namePrefix && `${guest.namePrefix} `}{guest.name}
                                </span>
                                <div className="text-sm text-muted-foreground">
                                  {guest.title && <span>{guest.title}</span>}
                                  {guest.title && guest.company && <span> · </span>}
                                  {guest.company && <span>{guest.company}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {guestEpisodes.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {guestEpisodes.length} episode{guestEpisodes.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {guest.featured && (
                                  <Badge variant="secondary">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Featured
                                  </Badge>
                                )}
                                <Badge variant={guest.status === "published" || !guest.status ? "default" : "outline"}>
                                  {guest.status === "published" || !guest.status ? (
                                    <><Eye className="h-3 w-3 mr-1" /> Published</>
                                  ) : (
                                    <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
                                  )}
                                </Badge>
                              </div>
                              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(guest)}
                                  data-testid={`button-edit-${guest.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this guest?")) {
                                      deleteMutation.mutate(guest.id);
                                    }
                                  }}
                                  data-testid={`button-delete-${guest.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t bg-muted/20 p-4">
                            <h4 className="font-medium mb-3 text-sm">Episodes featuring {guest.name}</h4>
                            {guestEpisodes.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {guestEpisodes.map((episode) => (
                                  <Card key={episode.id} className="overflow-hidden" data-testid={`episode-${episode.id}`}>
                                    <div className="flex items-start gap-3 p-3">
                                      {episode.thumbnailUrl && (
                                        <img 
                                          src={episode.thumbnailUrl} 
                                          alt={episode.title}
                                          className="w-20 h-14 object-cover rounded"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium line-clamp-2">{episode.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            Ep #{episode.episodeNumber}
                                          </Badge>
                                          {episode.viewCount && episode.viewCount > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                              {episode.viewCount.toLocaleString()} views
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {episode.youtubeUrl && (
                                        <a 
                                          href={episode.youtubeUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Play className="h-4 w-4" />
                                          </Button>
                                        </a>
                                      )}
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No episodes found for this guest.</p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MediaPickerDialog
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={(url) => setImageUrl(url)}
        title="Select Guest Profile Image"
      />
    </AdminLayout>
  );
}
