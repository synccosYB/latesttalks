import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Mail, Download, Users, Plus, UserPlus, Send, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { Subscriber } from "@shared/schema";
import { format } from "date-fns";

export default function AdminSubscribers() {
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({ email: "", name: "" });
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<Subscriber | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [composeEmail, setComposeEmail] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: subscribers, isLoading } = useQuery<Subscriber[]>({
    queryKey: ["/api/subscribers"],
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (data: { email: string; name?: string }) => {
      return apiRequest("POST", "/api/subscribers", { ...data, source: "admin-invite" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] });
      toast({ title: "Subscriber added successfully" });
      setShowAddDialog(false);
      setNewSubscriber({ email: "", name: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add subscriber", 
        description: error.message || "Email may already be subscribed",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/subscribers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] });
      toast({ title: "Subscriber removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove subscriber", variant: "destructive" });
    },
  });

  const messageMutation = useMutation({
    mutationFn: async ({ to, subject, message }: { to: string; subject: string; message: string }) => {
      const res = await apiRequest("POST", "/api/marketing/test-email", { to, subject, message });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      closeMessageDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    },
  });

  const openMessageDialog = (subscriber: Subscriber) => {
    setMessageRecipient(subscriber);
    setMessageSubject("");
    setMessageBody("");
    setShowMessageDialog(true);
  };

  const closeMessageDialog = () => {
    setShowMessageDialog(false);
    setMessageRecipient(null);
    setMessageSubject("");
    setMessageBody("");
  };

  const handleSendMessage = () => {
    if (!messageRecipient || !messageSubject.trim() || !messageBody.trim()) {
      toast({ title: "Please fill in both subject and message", variant: "destructive" });
      return;
    }

    messageMutation.mutate({
      to: messageRecipient.email,
      subject: messageSubject,
      message: messageBody,
    });
  };

  const openComposeDialog = () => {
    setShowComposeDialog(true);
    setComposeEmail("");
    setComposeSubject("");
    setComposeBody("");
  };

  const closeComposeDialog = () => {
    setShowComposeDialog(false);
    setComposeEmail("");
    setComposeSubject("");
    setComposeBody("");
  };

  const handleSendCompose = () => {
    if (!composeEmail.trim() || !composeSubject.trim() || !composeBody.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(composeEmail)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    messageMutation.mutate({
      to: composeEmail,
      subject: composeSubject,
      message: composeBody,
    });
    closeComposeDialog();
  };

  const filteredSubscribers = subscribers?.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeSubscribers = subscribers?.filter(s => s.status === "active").length || 0;

  const exportSubscribers = () => {
    if (!subscribers) return;
    
    const csv = [
      ["Email", "Name", "Status", "Subscribed Date"],
      ...subscribers.map(s => [
        s.email,
        s.name || "",
        s.status,
        s.createdAt ? format(new Date(s.createdAt), "yyyy-MM-dd") : ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Subscribers exported successfully" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Subscribers</h1>
            <p className="text-muted-foreground">Manage newsletter subscribers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openComposeDialog} variant="outline" data-testid="button-compose-message">
              <Mail className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
            <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-subscriber">
              <Plus className="h-4 w-4 mr-2" />
              Add Subscriber
            </Button>
            <Button onClick={exportSubscribers} variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscribers?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubscribers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(subscribers?.length || 0) - activeSubscribers}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscribers..."
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
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers?.map((subscriber) => (
                    <TableRow key={subscriber.id} data-testid={`row-subscriber-${subscriber.id}`}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell>{subscriber.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={subscriber.status === "active" ? "default" : "secondary"}>
                          {subscriber.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscriber.createdAt
                          ? format(new Date(subscriber.createdAt), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openMessageDialog(subscriber)}
                            data-testid={`button-message-${subscriber.id}`}
                            title="Send message"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to remove this subscriber?")) {
                                deleteMutation.mutate(subscriber.id);
                              }
                            }}
                            data-testid={`button-delete-${subscriber.id}`}
                            title="Remove subscriber"
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

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Subscriber
            </DialogTitle>
            <DialogDescription>
              Manually add a subscriber to the newsletter list.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newSubscriber.email) {
                toast({ title: "Email is required", variant: "destructive" });
                return;
              }
              addMutation.mutate(newSubscriber);
            }}
            className="space-y-4 mt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newSubscriber.email}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                placeholder="subscriber@example.com"
                required
                data-testid="input-new-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={newSubscriber.name}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, name: e.target.value })}
                placeholder="Full name"
                data-testid="input-new-name"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-add"
              >
                {addMutation.isPending ? "Adding..." : "Add Subscriber"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Message Dialog (for individual subscriber) */}
      <Dialog open={showMessageDialog} onOpenChange={(open) => !open && closeMessageDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Send Message to {messageRecipient?.name || messageRecipient?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                To: {messageRecipient?.email}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message-subject">Subject</Label>
              <Input
                id="message-subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="Email subject"
                data-testid="input-message-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message-body">Message</Label>
              <Textarea
                id="message-body"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Write your message..."
                rows={6}
                className="resize-none"
                data-testid="input-message-body"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeMessageDialog} disabled={messageMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={messageMutation.isPending} data-testid="button-send-message">
              {messageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Message Dialog (new email) */}
      <Dialog open={showComposeDialog} onOpenChange={(open) => !open && closeComposeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="compose-email">To</Label>
              <Input
                id="compose-email"
                type="email"
                value={composeEmail}
                onChange={(e) => setComposeEmail(e.target.value)}
                placeholder="recipient@example.com"
                data-testid="input-compose-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compose-subject">Subject</Label>
              <Input
                id="compose-subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Email subject"
                data-testid="input-compose-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compose-body">Message</Label>
              <Textarea
                id="compose-body"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                rows={6}
                className="resize-none"
                data-testid="input-compose-body"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeComposeDialog} disabled={messageMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSendCompose} disabled={messageMutation.isPending} data-testid="button-send-compose">
              {messageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
