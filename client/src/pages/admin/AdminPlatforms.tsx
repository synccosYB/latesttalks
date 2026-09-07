import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Monitor, Plus, ExternalLink, Mail, Phone, User, Users } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Platform } from "@shared/schema";

type PlatformWithUsers = Platform & { platformUserCount?: number };

export default function AdminPlatforms() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    podcastLink: "",
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
  });

  const { data: platforms = [], isLoading } = useQuery<PlatformWithUsers[]>({
    queryKey: ["/api/platforms"],
  });

  const addPlatformMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/platforms", {
        name: data.name,
        podcastLink: data.podcastLink || undefined,
        primaryContactName: data.primaryContactName || undefined,
        primaryContactEmail: data.primaryContactEmail || undefined,
        primaryContactPhone: data.primaryContactPhone || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({ title: "Platform created successfully" });
      setShowAddDialog(false);
      setFormData({
        name: "",
        podcastLink: "",
        primaryContactName: "",
        primaryContactEmail: "",
        primaryContactPhone: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create platform",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#10213A]" data-testid="text-title">Platforms</h1>
            <p className="text-muted-foreground">Manage external podcast platforms</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-platform"
            className="bg-[#DE2026]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Platform
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : platforms.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No platforms yet</p>
            <p className="text-sm">Add your first platform to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <Link
                key={platform.id}
                href={`/admin/platforms/${platform.id}`}
                data-testid={`card-platform-${platform.id}`}
              >
                <Card className="hover-elevate cursor-pointer overflow-visible">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Monitor className="h-5 w-5 text-[#10213A] shrink-0" />
                        <span className="font-semibold text-[#10213A] truncate" data-testid={`text-platform-name-${platform.id}`}>
                          {platform.name}
                        </span>
                      </div>
                      <Badge
                        className={platform.status === "active" ? "bg-green-500" : "bg-gray-400"}
                        data-testid={`badge-status-${platform.id}`}
                      >
                        {platform.status}
                      </Badge>
                    </div>

                    {platform.podcastLink && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate" data-testid={`text-podcast-link-${platform.id}`}>{platform.podcastLink}</span>
                      </div>
                    )}

                    {platform.primaryContactName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span data-testid={`text-contact-name-${platform.id}`}>{platform.primaryContactName}</span>
                      </div>
                    )}

                    {platform.primaryContactEmail && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate" data-testid={`text-contact-email-${platform.id}`}>{platform.primaryContactEmail}</span>
                      </div>
                    )}

                    {platform.primaryContactPhone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span data-testid={`text-contact-phone-${platform.id}`}>{platform.primaryContactPhone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span data-testid={`text-user-count-${platform.id}`}>
                          {platform.platformUserCount ?? 0} users
                        </span>
                      </div>
                      {platform.createdAt && (
                        <span data-testid={`text-created-${platform.id}`}>
                          {format(new Date(platform.createdAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Add Platform
            </DialogTitle>
            <DialogDescription>
              Add a new external podcast platform.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formData.name.trim()) {
                toast({ title: "Platform name is required", variant: "destructive" });
                return;
              }
              addPlatformMutation.mutate(formData);
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name *</Label>
              <Input
                id="platform-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Apple Podcasts"
                required
                data-testid="input-platform-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="podcast-link">Podcast Link</Label>
              <Input
                id="podcast-link"
                value={formData.podcastLink}
                onChange={(e) => setFormData({ ...formData, podcastLink: e.target.value })}
                placeholder="https://..."
                data-testid="input-podcast-link"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-name">Primary Contact Name</Label>
              <Input
                id="contact-name"
                value={formData.primaryContactName}
                onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                placeholder="John Doe"
                data-testid="input-contact-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Primary Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.primaryContactEmail}
                onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
                placeholder="contact@example.com"
                data-testid="input-contact-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Primary Contact Phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={formData.primaryContactPhone}
                onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
                placeholder="(555) 123-4567"
                data-testid="input-contact-phone"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#DE2026]"
              disabled={addPlatformMutation.isPending}
              data-testid="button-submit-platform"
            >
              {addPlatformMutation.isPending ? "Creating..." : "Create Platform"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
