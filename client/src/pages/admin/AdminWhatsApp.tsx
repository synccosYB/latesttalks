import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Trash2, 
  Download, 
  Users, 
  Plus, 
  UserPlus, 
  Send, 
  Loader2,
  MessageCircle,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Settings,
  Megaphone,
  BarChart3
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { WhatsappContact, WhatsappTemplate, WhatsappSendLog } from "@shared/schema";
import { format } from "date-fns";

interface WhatsAppStatus {
  configured: boolean;
  message: string;
}

interface WhatsAppStats {
  totalContacts: number;
  activeContacts: number;
  totalMessagesSent: number;
  deliveryRate: number;
  readRate: number;
}

export default function AdminWhatsApp() {
  const [search, setSearch] = useState("");
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [newContact, setNewContact] = useState({ phone: "", name: "", notes: "" });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "MARKETING",
    language: "en",
    bodyText: "",
    footerText: ""
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: status } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<WhatsAppStats>({
    queryKey: ["/api/whatsapp/stats"],
    enabled: !!user,
  });

  const { data: contacts, isLoading: loadingContacts } = useQuery<WhatsappContact[]>({
    queryKey: ["/api/whatsapp/contacts"],
    enabled: !!user,
  });

  const { data: templates, isLoading: loadingTemplates } = useQuery<WhatsappTemplate[]>({
    queryKey: ["/api/whatsapp/templates"],
    enabled: !!user,
  });

  const { data: sendLogs, isLoading: loadingLogs } = useQuery<WhatsappSendLog[]>({
    queryKey: ["/api/whatsapp/send-logs"],
    enabled: !!user,
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: typeof newContact) => {
      return apiRequest("POST", "/api/whatsapp/contacts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/stats"] });
      toast({ title: "Contact added successfully" });
      setShowAddContactDialog(false);
      setNewContact({ phone: "", name: "", notes: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add contact", 
        description: error.message || "Phone number may already exist",
        variant: "destructive" 
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/whatsapp/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/stats"] });
      toast({ title: "Contact removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove contact", variant: "destructive" });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WhatsappContact> }) => {
      return apiRequest("PATCH", `/api/whatsapp/contacts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/contacts"] });
      toast({ title: "Contact updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update contact", variant: "destructive" });
    },
  });

  const addTemplateMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      return apiRequest("POST", "/api/whatsapp/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/templates"] });
      toast({ title: "Template added successfully" });
      setShowTemplateDialog(false);
      setNewTemplate({ name: "", category: "MARKETING", language: "en", bodyText: "", footerText: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add template", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const sendAnnouncementMutation = useMutation({
    mutationFn: async ({ message, tags }: { message: string; tags?: string[] }) => {
      return apiRequest("POST", "/api/whatsapp/broadcast/announcement", { message, tags });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/send-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/stats"] });
      toast({ 
        title: "Announcement sent", 
        description: `Sent to ${data.sentCount} contacts` 
      });
      setShowAnnouncementDialog(false);
      setAnnouncement("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send announcement", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredContacts = contacts?.filter((c) =>
    c.phone.includes(search) ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.waId.includes(search)
  );

  const activeContacts = contacts?.filter(c => c.status === "active").length || 0;

  const exportContacts = () => {
    if (!contacts) return;
    
    const csv = [
      ["Phone", "Name", "Status", "Source", "Opted In Date"],
      ...contacts.map(c => [
        c.phone,
        c.name || "",
        c.status,
        c.optInSource || "",
        c.consentTimestamp ? format(new Date(c.consentTimestamp), "yyyy-MM-dd") : ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-contacts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Contacts exported successfully" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "unsubscribed":
        return <Badge variant="secondary">Unsubscribed</Badge>;
      case "blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLogStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "sending":
        return <Badge className="bg-blue-500">Sending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!status?.configured) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <SiWhatsapp className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">WhatsApp Broadcast</h1>
              <p className="text-muted-foreground">Send episode updates to subscribers via WhatsApp</p>
            </div>
          </div>

          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                WhatsApp Not Configured
              </CardTitle>
              <CardDescription className="text-amber-600 dark:text-amber-300">
                To enable WhatsApp broadcasting, you need to set up the Meta WhatsApp Business API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Create a Meta Business account at business.facebook.com</li>
                  <li>Set up WhatsApp Business API in the Meta Business Suite</li>
                  <li>Get your Phone Number ID and Access Token</li>
                  <li>Add the following secrets to your app:
                    <ul className="ml-6 mt-1 space-y-1">
                      <li><code className="bg-muted px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code></li>
                      <li><code className="bg-muted px-1 rounded">WHATSAPP_ACCESS_TOKEN</code></li>
                    </ul>
                  </li>
                  <li>Configure the webhook URL: <code className="bg-muted px-1 rounded">/api/whatsapp/webhook</code></li>
                </ol>
              </div>
              <div className="pt-4">
                <Button variant="outline" asChild>
                  <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer">
                    View Meta Documentation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Contacts (Offline Mode)</CardTitle>
              <CardDescription>
                You can still manage your contact list while WhatsApp is not configured.
                Contacts will receive messages once the API is set up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowAddContactDialog(true)} data-testid="button-add-contact">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add WhatsApp Contact
              </DialogTitle>
              <DialogDescription>
                Add a subscriber to receive WhatsApp updates.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newContact.phone) {
                  toast({ title: "Phone number is required", variant: "destructive" });
                  return;
                }
                addContactMutation.mutate(newContact);
              }}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+1234567890"
                  required
                  data-testid="input-new-phone"
                />
                <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Contact name"
                  data-testid="input-new-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  placeholder="Any notes about this contact..."
                  data-testid="input-new-notes"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddContactDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addContactMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-add"
                >
                  {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SiWhatsapp className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">WhatsApp Broadcast</h1>
              <p className="text-muted-foreground">Send episode updates to subscribers via WhatsApp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAnnouncementDialog(true)} data-testid="button-send-announcement">
              <Megaphone className="h-4 w-4 mr-2" />
              Send Announcement
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeContacts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMessagesSent || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.deliveryRate || 0}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.readRate || 0}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contacts" data-testid="tab-contacts">Contacts</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Send History</TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      data-testid="input-search"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setShowAddContactDialog(true)} data-testid="button-add-contact">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                    <Button onClick={exportContacts} variant="outline" data-testid="button-export">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingContacts ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Last Message</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts?.map((contact) => (
                        <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                          <TableCell className="font-medium">{contact.phone}</TableCell>
                          <TableCell>{contact.name || "-"}</TableCell>
                          <TableCell>{getStatusBadge(contact.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{contact.optInSource}</Badge>
                          </TableCell>
                          <TableCell>
                            {contact.lastMessageAt
                              ? format(new Date(contact.lastMessageAt), "MMM d, yyyy")
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {contact.status === "active" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateContactMutation.mutate({ 
                                    id: contact.id, 
                                    data: { status: "unsubscribed" } 
                                  })}
                                  data-testid={`button-unsubscribe-${contact.id}`}
                                  title="Unsubscribe"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {contact.status === "unsubscribed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateContactMutation.mutate({ 
                                    id: contact.id, 
                                    data: { status: "active" } 
                                  })}
                                  data-testid={`button-resubscribe-${contact.id}`}
                                  title="Resubscribe"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this contact?")) {
                                    deleteContactMutation.mutate(contact.id);
                                  }
                                }}
                                data-testid={`button-delete-${contact.id}`}
                                title="Delete contact"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredContacts || filteredContacts.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No contacts found. Add your first WhatsApp subscriber!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Send History</CardTitle>
                <CardDescription>View past WhatsApp broadcasts and their delivery status</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Read</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sendLogs?.map((log) => (
                        <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                          <TableCell>
                            {log.sentAt
                              ? format(new Date(log.sentAt), "MMM d, yyyy h:mm a")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.messageType === "episode" ? "Episode" : "Announcement"}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.recipientCount}</TableCell>
                          <TableCell className="text-green-600">{log.sentCount}</TableCell>
                          <TableCell className="text-blue-600">{log.deliveredCount}</TableCell>
                          <TableCell className="text-purple-600">{log.readCount}</TableCell>
                          <TableCell className="text-red-600">{log.failedCount}</TableCell>
                          <TableCell>{getLogStatusBadge(log.status)}</TableCell>
                        </TableRow>
                      ))}
                      {(!sendLogs || sendLogs.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No broadcasts sent yet. Send your first announcement!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Message Templates</CardTitle>
                    <CardDescription>
                      Templates must be approved by Meta before use. Create them in Meta Business Manager first.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowTemplateDialog(true)} data-testid="button-add-template">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTemplates ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Body Preview</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates?.map((template) => (
                        <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{template.category}</Badge>
                          </TableCell>
                          <TableCell>{template.language}</TableCell>
                          <TableCell className="max-w-xs truncate">{template.bodyText}</TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                template.status === "approved" 
                                  ? "bg-green-500" 
                                  : template.status === "rejected"
                                  ? "bg-red-500"
                                  : ""
                              }
                              variant={template.status === "pending" ? "outline" : "default"}
                            >
                              {template.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!templates || templates.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No templates configured. Add a template to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add WhatsApp Contact
            </DialogTitle>
            <DialogDescription>
              Add a subscriber to receive WhatsApp updates.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newContact.phone) {
                toast({ title: "Phone number is required", variant: "destructive" });
                return;
              }
              addContactMutation.mutate(newContact);
            }}
            className="space-y-4 mt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+1234567890"
                required
                data-testid="input-new-phone"
              />
              <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Contact name"
                data-testid="input-new-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                placeholder="Any notes about this contact..."
                data-testid="input-new-notes"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddContactDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addContactMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-add"
              >
                {addContactMutation.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Send Announcement
            </DialogTitle>
            <DialogDescription>
              Send a message to all active WhatsApp subscribers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-muted rounded-md text-sm">
              <p><strong>Recipients:</strong> {activeContacts} active contacts</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement">Message</Label>
              <Textarea
                id="announcement"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Write your announcement message..."
                rows={6}
                data-testid="input-announcement"
              />
              <p className="text-xs text-muted-foreground">
                Note: Custom messages may only work within 24 hours of user interaction.
                For broader reach, use pre-approved templates.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAnnouncementDialog(false)}
              disabled={sendAnnouncementMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => sendAnnouncementMutation.mutate({ message: announcement })}
              disabled={!announcement.trim() || sendAnnouncementMutation.isPending}
              data-testid="button-confirm-announcement"
            >
              {sendAnnouncementMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {activeContacts} Contacts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Add Template Reference
            </DialogTitle>
            <DialogDescription>
              Add a reference to a template you've created in Meta Business Manager.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTemplate.name || !newTemplate.bodyText) {
                toast({ title: "Name and body text are required", variant: "destructive" });
                return;
              }
              addTemplateMutation.mutate(newTemplate);
            }}
            className="space-y-4 mt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="new_episode_notification"
                required
                data-testid="input-template-name"
              />
              <p className="text-xs text-muted-foreground">Must match the name in Meta Business Manager</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select
                  value={newTemplate.category}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                >
                  <SelectTrigger data-testid="select-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-language">Language</Label>
                <Select
                  value={newTemplate.language}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, language: value })}
                >
                  <SelectTrigger data-testid="select-template-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="yi">Yiddish</SelectItem>
                    <SelectItem value="he">Hebrew</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-body">Body Text *</Label>
              <Textarea
                id="template-body"
                value={newTemplate.bodyText}
                onChange={(e) => setNewTemplate({ ...newTemplate, bodyText: e.target.value })}
                placeholder="New episode just dropped! {{1}} featuring {{2}}. Watch now!"
                rows={4}
                data-testid="input-template-body"
              />
              <p className="text-xs text-muted-foreground">Use {"{{1}}"}, {"{{2}}"} for dynamic content</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addTemplateMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-template"
              >
                {addTemplateMutation.isPending ? "Adding..." : "Add Template"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
