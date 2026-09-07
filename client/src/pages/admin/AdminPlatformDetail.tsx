import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pencil, ExternalLink, Plus, Trash2, Lock, Unlock, KeyRound, Copy,
  ChevronDown, ChevronUp, Users, Mail, Phone, User, History,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Platform, PlatformContact, PlatformUser, EpisodePlatformKpi } from "@shared/schema";

type KpiHistoryEntry = {
  id: string;
  platformId: string;
  websiteEpisodeId: string;
  fieldChanged: string;
  previousValue: string | null;
  newValue: string | null;
  timestamp: string | null;
  userId: string | null;
  editSource: string;
};

type KpiWithEpisode = EpisodePlatformKpi & {
  episodeNumber?: number | null;
  episodeTitle?: string | null;
  guestName?: string | null;
};

function formatTime(seconds: number | null | undefined): string {
  if (!seconds) return "\u2014";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function AdminPlatformDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", podcastLink: "", primaryContactName: "", primaryContactEmail: "", primaryContactPhone: "" });
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ email: "", label: "manager", phone: "", phoneLabel: "" });
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [credentialDialog, setCredentialDialog] = useState<{ email: string; tempPassword: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: platform, isLoading: platformLoading } = useQuery<Platform>({
    queryKey: ["/api/platforms", id],
  });

  const { data: contacts = [] } = useQuery<PlatformContact[]>({
    queryKey: ["/api/platforms", id, "contacts"],
  });

  const { data: users = [] } = useQuery<PlatformUser[]>({
    queryKey: ["/api/platforms", id, "users"],
  });

  const { data: kpis = [] } = useQuery<KpiWithEpisode[]>({
    queryKey: ["/api/platforms", id, "kpis"],
  });

  const { data: history = [] } = useQuery<KpiHistoryEntry[]>({
    queryKey: ["/api/platform-kpis/history", id],
  });

  const updatePlatformMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      return apiRequest("PATCH", `/api/platforms/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({ title: "Platform updated" });
      setEditOpen(false);
    },
    onError: () => toast({ title: "Failed to update platform", variant: "destructive" }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const newStatus = platform?.status === "active" ? "disabled" : "active";
      return apiRequest("PATCH", `/api/platforms/${id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({ title: `Platform ${platform?.status === "active" ? "disabled" : "enabled"}` });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: typeof contactForm) => {
      return apiRequest("POST", `/api/platforms/${id}/contacts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", id, "contacts"] });
      toast({ title: "Contact added" });
      setAddContactOpen(false);
      setContactForm({ email: "", label: "manager", phone: "", phoneLabel: "" });
    },
    onError: () => toast({ title: "Failed to add contact", variant: "destructive" }),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return apiRequest("DELETE", `/api/platform-contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", id, "contacts"] });
      toast({ title: "Contact deleted" });
    },
    onError: () => toast({ title: "Failed to delete contact", variant: "destructive" }),
  });

  const addUserMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", `/api/platforms/${id}/users`, { email });
      return res.json();
    },
    onSuccess: (data: { user: PlatformUser; tempPassword: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", id, "users"] });
      setAddUserOpen(false);
      setUserEmail("");
      setCredentialDialog({ email: data.user.email, tempPassword: data.tempPassword });
    },
    onError: () => toast({ title: "Failed to add user", variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/platform-users/${userId}/reset-password`);
      return res.json();
    },
    onSuccess: (data: { tempPassword: string; email?: string }, userId: string) => {
      const u = users.find(u => u.id === userId);
      setCredentialDialog({ email: u?.email || data.email || "", tempPassword: data.tempPassword });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", id, "users"] });
    },
    onError: () => toast({ title: "Failed to reset password", variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/platform-users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", id, "users"] });
      toast({ title: "User deleted" });
    },
    onError: () => toast({ title: "Failed to delete user", variant: "destructive" }),
  });

  const lockKpiMutation = useMutation({
    mutationFn: async ({ kpiId, isLocked }: { kpiId: string; isLocked: boolean }) => {
      return apiRequest("PATCH", `/api/platform-kpis/${kpiId}/lock`, { isLocked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", id, "kpis"] });
      toast({ title: "KPI lock status updated" });
    },
    onError: () => toast({ title: "Failed to update lock", variant: "destructive" }),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const openEditDialog = () => {
    if (platform) {
      setEditForm({
        name: platform.name || "",
        podcastLink: platform.podcastLink || "",
        primaryContactName: platform.primaryContactName || "",
        primaryContactEmail: platform.primaryContactEmail || "",
        primaryContactPhone: platform.primaryContactPhone || "",
      });
    }
    setEditOpen(true);
  };

  const sortedHistory = [...history].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return bTime - aTime;
  });

  if (platformLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!platform) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground" data-testid="text-not-found">
          Platform not found
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" data-testid="text-platform-name">{platform.name}</h1>
            <Badge variant={platform.status === "active" ? "default" : "secondary"} data-testid="badge-platform-status">
              {platform.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={openEditDialog} data-testid="button-edit-platform">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant={platform.status === "active" ? "destructive" : "default"}
              onClick={() => toggleStatusMutation.mutate()}
              disabled={toggleStatusMutation.isPending}
              data-testid="button-toggle-status"
            >
              {platform.status === "active" ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>

        {platform.podcastLink && (
          <a
            href={platform.podcastLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400"
            data-testid="link-podcast"
          >
            <ExternalLink className="h-3 w-3" />
            {platform.podcastLink}
          </a>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contacts
            </CardTitle>
            <Button size="sm" onClick={() => setAddContactOpen(true)} data-testid="button-add-contact">
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(platform.primaryContactName || platform.primaryContactEmail || platform.primaryContactPhone) && (
              <div className="space-y-1" data-testid="section-primary-contact">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Contact</p>
                {platform.primaryContactName && (
                  <p className="flex items-center gap-2 text-sm" data-testid="text-primary-contact-name">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {platform.primaryContactName}
                  </p>
                )}
                {platform.primaryContactEmail && (
                  <p className="flex items-center gap-2 text-sm" data-testid="text-primary-contact-email">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {platform.primaryContactEmail}
                  </p>
                )}
                {platform.primaryContactPhone && (
                  <p className="flex items-center gap-2 text-sm" data-testid="text-primary-contact-phone">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {platform.primaryContactPhone}
                  </p>
                )}
              </div>
            )}

            {contacts.length > 0 && (
              <div className="space-y-2" data-testid="section-additional-contacts">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Contacts</p>
                {contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 border rounded-md p-3" data-testid={`contact-${c.id}`}>
                    <div className="flex flex-col gap-1 text-sm">
                      {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{c.email}</span>}
                      {c.label && <Badge variant="outline" className="w-fit">{c.label}</Badge>}
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{c.phone}{c.phoneLabel ? ` (${c.phoneLabel})` : ""}</span>}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteContactMutation.mutate(c.id)}
                      disabled={deleteContactMutation.isPending}
                      data-testid={`button-delete-contact-${c.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!platform.primaryContactName && !platform.primaryContactEmail && !platform.primaryContactPhone && contacts.length === 0 && (
              <p className="text-sm text-muted-foreground">No contacts added yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Platform Users
            </CardTitle>
            <Button size="sm" onClick={() => setAddUserOpen(true)} data-testid="button-add-user">
              <Plus className="h-4 w-4 mr-1" />
              Add User
            </Button>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No users yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Must Change Password</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                      <TableCell data-testid={`text-user-email-${u.id}`}>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === "active" ? "default" : "secondary"} data-testid={`badge-user-status-${u.id}`}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-must-change-${u.id}`}>{u.mustChangePassword ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetPasswordMutation.mutate(u.id)}
                            disabled={resetPasswordMutation.isPending}
                            data-testid={`button-reset-password-${u.id}`}
                          >
                            <KeyRound className="h-3 w-3 mr-1" />
                            Reset Password
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteUserMutation.mutate(u.id)}
                            disabled={deleteUserMutation.isPending}
                            data-testid={`button-delete-user-${u.id}`}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              KPI Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpis.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No KPI data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Episode #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Total Watch Time</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Avg Watch Time</TableHead>
                      <TableHead>Locked</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.map((kpi) => (
                      <TableRow key={kpi.id} data-testid={`row-kpi-${kpi.id}`}>
                        <TableCell data-testid={`text-episode-number-${kpi.id}`}>
                          {kpi.episodeNumber ?? "\u2014"}
                        </TableCell>
                        <TableCell data-testid={`text-episode-title-${kpi.id}`}>
                          {kpi.episodeTitle ?? "\u2014"}
                        </TableCell>
                        <TableCell data-testid={`text-guest-${kpi.id}`}>
                          {kpi.guestName ?? "\u2014"}
                        </TableCell>
                        <TableCell data-testid={`text-total-watch-${kpi.id}`}>
                          <span className={kpi.kpi1Auto ? "italic" : ""}>
                            {formatTime(kpi.totalWatchTimeSeconds)}
                          </span>
                          {kpi.kpi1Auto && <Badge variant="outline" className="ml-1 text-xs">auto</Badge>}
                        </TableCell>
                        <TableCell data-testid={`text-views-${kpi.id}`}>
                          <span className={kpi.kpi2Auto ? "italic" : ""}>
                            {kpi.views ?? "\u2014"}
                          </span>
                          {kpi.kpi2Auto && <Badge variant="outline" className="ml-1 text-xs">auto</Badge>}
                        </TableCell>
                        <TableCell data-testid={`text-avg-watch-${kpi.id}`}>
                          <span className={kpi.kpi3Auto ? "italic" : ""}>
                            {formatTime(kpi.avgWatchTimeSeconds)}
                          </span>
                          {kpi.kpi3Auto && <Badge variant="outline" className="ml-1 text-xs">auto</Badge>}
                        </TableCell>
                        <TableCell data-testid={`text-locked-${kpi.id}`}>
                          {kpi.isLocked ? (
                            <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
                          ) : (
                            <Badge variant="outline"><Unlock className="h-3 w-3 mr-1" />Unlocked</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => lockKpiMutation.mutate({ kpiId: kpi.id, isLocked: !kpi.isLocked })}
                            disabled={lockKpiMutation.isPending}
                            data-testid={`button-toggle-lock-${kpi.id}`}
                          >
                            {kpi.isLocked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                            {kpi.isLocked ? "Unlock" : "Lock"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between gap-2 p-0" data-testid="button-toggle-history">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    KPI History Log
                  </CardTitle>
                  {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                {sortedHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No history entries.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date/Time</TableHead>
                          <TableHead>Episode</TableHead>
                          <TableHead>Field Changed</TableHead>
                          <TableHead>Previous Value</TableHead>
                          <TableHead>New Value</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedHistory.map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-history-${entry.id}`}>
                            <TableCell data-testid={`text-history-time-${entry.id}`}>
                              {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "\u2014"}
                            </TableCell>
                            <TableCell data-testid={`text-history-episode-${entry.id}`}>{entry.websiteEpisodeId}</TableCell>
                            <TableCell data-testid={`text-history-field-${entry.id}`}>{entry.fieldChanged}</TableCell>
                            <TableCell data-testid={`text-history-prev-${entry.id}`}>{entry.previousValue ?? "\u2014"}</TableCell>
                            <TableCell data-testid={`text-history-new-${entry.id}`}>{entry.newValue ?? "\u2014"}</TableCell>
                            <TableCell data-testid={`text-history-source-${entry.id}`}>{entry.editSource}</TableCell>
                            <TableCell data-testid={`text-history-user-${entry.id}`}>{entry.userId ?? "\u2014"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Platform</DialogTitle>
            <DialogDescription>Update platform details.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePlatformMutation.mutate(editForm);
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required data-testid="input-edit-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-podcast-link">Podcast Link</Label>
              <Input id="edit-podcast-link" value={editForm.podcastLink} onChange={(e) => setEditForm({ ...editForm, podcastLink: e.target.value })} data-testid="input-edit-podcast-link" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-name">Contact Name</Label>
              <Input id="edit-contact-name" value={editForm.primaryContactName} onChange={(e) => setEditForm({ ...editForm, primaryContactName: e.target.value })} data-testid="input-edit-contact-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-email">Contact Email</Label>
              <Input id="edit-contact-email" type="email" value={editForm.primaryContactEmail} onChange={(e) => setEditForm({ ...editForm, primaryContactEmail: e.target.value })} data-testid="input-edit-contact-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-phone">Contact Phone</Label>
              <Input id="edit-contact-phone" value={editForm.primaryContactPhone} onChange={(e) => setEditForm({ ...editForm, primaryContactPhone: e.target.value })} data-testid="input-edit-contact-phone" />
            </div>
            <Button type="submit" disabled={updatePlatformMutation.isPending} className="w-full" data-testid="button-save-edit">
              {updatePlatformMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Add an additional contact for this platform.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addContactMutation.mutate(contactForm);
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} data-testid="input-contact-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-label">Label</Label>
              <Select value={contactForm.label} onValueChange={(v) => setContactForm({ ...contactForm, label: v })}>
                <SelectTrigger data-testid="select-contact-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input id="contact-phone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} data-testid="input-contact-phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone-label">Phone Label</Label>
              <Input id="contact-phone-label" value={contactForm.phoneLabel} onChange={(e) => setContactForm({ ...contactForm, phoneLabel: e.target.value })} data-testid="input-contact-phone-label" />
            </div>
            <Button type="submit" disabled={addContactMutation.isPending} className="w-full" data-testid="button-save-contact">
              {addContactMutation.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Platform User</DialogTitle>
            <DialogDescription>Create a login account for this platform.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (userEmail) addUserMutation.mutate(userEmail);
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
                data-testid="input-user-email"
              />
            </div>
            <Button type="submit" disabled={addUserMutation.isPending} className="w-full" data-testid="button-save-user">
              {addUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentialDialog} onOpenChange={() => setCredentialDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Credentials</DialogTitle>
            <DialogDescription>Share these credentials with the platform user. The temporary password must be changed on first login.</DialogDescription>
          </DialogHeader>
          {credentialDialog && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between gap-2 border rounded-md p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Login URL</p>
                  <p className="text-sm font-medium" data-testid="text-login-url">/platform/login</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(`${window.location.origin}/platform/login`)} data-testid="button-copy-login-url">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2 border rounded-md p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium" data-testid="text-credential-email">{credentialDialog.email}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentialDialog.email)} data-testid="button-copy-email">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2 border rounded-md p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Temporary Password</p>
                  <p className="text-sm font-mono font-medium" data-testid="text-temp-password">{credentialDialog.tempPassword}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentialDialog.tempPassword)} data-testid="button-copy-password">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
