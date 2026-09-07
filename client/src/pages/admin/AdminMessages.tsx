import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, MailOpen, Eye, Inbox, CheckCircle, Send, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ContactMessage, SponsorInquiry } from "@shared/schema";
import { format } from "date-fns";

export default function AdminMessages() {
  const [activeTab, setActiveTab] = useState("contact");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<SponsorInquiry | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ContactMessage | null>(null);
  const [replyToInquiry, setReplyToInquiry] = useState<SponsorInquiry | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeEmail, setComposeEmail] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const { toast } = useToast();

  const { data: contactMessages, isLoading: loadingMessages } = useQuery<ContactMessage[]>({
    queryKey: ["/api/contact-messages"],
  });

  const { data: sponsorInquiries, isLoading: loadingInquiries } = useQuery<SponsorInquiry[]>({
    queryKey: ["/api/sponsor-inquiries"],
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/contact-messages/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-messages"] });
      toast({ title: "Message updated" });
    },
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/sponsor-inquiries/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor-inquiries"] });
      toast({ title: "Inquiry updated" });
    },
  });

  const replyToMessageMutation = useMutation({
    mutationFn: async ({ id, subject, message }: { id: string; subject: string; message: string }) => {
      const res = await apiRequest("POST", `/api/contact-messages/${id}/reply`, { subject, message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-messages"] });
      toast({ title: "Reply sent successfully" });
      closeReplyDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send reply", description: error.message, variant: "destructive" });
    },
  });

  const replyToInquiryMutation = useMutation({
    mutationFn: async ({ id, subject, message }: { id: string; subject: string; message: string }) => {
      const res = await apiRequest("POST", `/api/sponsor-inquiries/${id}/reply`, { subject, message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor-inquiries"] });
      toast({ title: "Reply sent successfully" });
      closeReplyDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send reply", description: error.message, variant: "destructive" });
    },
  });

  const unreadMessages = contactMessages?.filter((m) => m.status === "unread").length || 0;
  const newInquiries = sponsorInquiries?.filter((i) => i.status === "new").length || 0;

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    if (message.status === "unread") {
      updateContactMutation.mutate({ id: message.id, status: "read" });
    }
  };

  const handleViewInquiry = (inquiry: SponsorInquiry) => {
    setSelectedInquiry(inquiry);
    if (inquiry.status === "new") {
      updateInquiryMutation.mutate({ id: inquiry.id, status: "contacted" });
    }
  };

  const openReplyToMessage = (message: ContactMessage) => {
    setReplyToMessage(message);
    setReplySubject(`Re: ${message.subject || "Your message to Latest Talks"}`);
    setReplyBody("");
    setSelectedMessage(null);
  };

  const openReplyToInquiry = (inquiry: SponsorInquiry) => {
    setReplyToInquiry(inquiry);
    setReplySubject(`Re: Sponsorship Inquiry from ${inquiry.companyName}`);
    setReplyBody("");
    setSelectedInquiry(null);
  };

  const closeReplyDialog = () => {
    setReplyToMessage(null);
    setReplyToInquiry(null);
    setReplySubject("");
    setReplyBody("");
  };

  const openComposeDialog = () => {
    setShowCompose(true);
    setComposeEmail("");
    setComposeSubject("");
    setComposeBody("");
  };

  const closeComposeDialog = () => {
    setShowCompose(false);
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

    composeMutation.mutate({
      to: composeEmail,
      subject: composeSubject,
      message: composeBody,
    });
  };

  const handleSendReply = () => {
    if (!replySubject.trim() || !replyBody.trim()) {
      toast({ title: "Please fill in both subject and message", variant: "destructive" });
      return;
    }

    if (replyToMessage) {
      replyToMessageMutation.mutate({
        id: replyToMessage.id,
        subject: replySubject,
        message: replyBody,
      });
    } else if (replyToInquiry) {
      replyToInquiryMutation.mutate({
        id: replyToInquiry.id,
        subject: replySubject,
        message: replyBody,
      });
    }
  };

  const composeMutation = useMutation({
    mutationFn: async ({ to, subject, message }: { to: string; subject: string; message: string }) => {
      const res = await apiRequest("POST", "/api/marketing/test-email", { to, subject, message });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      closeComposeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    },
  });

  const isSending = replyToMessageMutation.isPending || replyToInquiryMutation.isPending || composeMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Messages</h1>
            <p className="text-muted-foreground">View contact messages and sponsor inquiries</p>
          </div>
          <Button onClick={openComposeDialog} data-testid="button-compose-message">
            <Send className="h-4 w-4 mr-2" />
            Compose Message
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadMessages}</div>
              <p className="text-xs text-muted-foreground">Contact form submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Sponsor Inquiries</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newInquiries}</div>
              <p className="text-xs text-muted-foreground">Advertising requests</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="contact" data-testid="tab-contact">
              Contact Messages ({contactMessages?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="sponsors" data-testid="tab-sponsors">
              Sponsor Inquiries ({sponsorInquiries?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="mt-4">
            {loadingMessages ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : contactMessages && contactMessages.length > 0 ? (
              <div className="space-y-3">
                {contactMessages.map((message) => (
                  <Card
                    key={message.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleViewMessage(message)}
                    data-testid={`card-message-${message.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {message.status === "unread" ? (
                              <Mail className="h-4 w-4 text-primary" />
                            ) : (
                              <MailOpen className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{message.name}</span>
                            <Badge variant={message.status === "unread" ? "default" : "secondary"}>
                              {message.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {message.subject || message.message.slice(0, 60)}...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.email} • {message.createdAt ? format(new Date(message.createdAt), "MMM d, yyyy") : ""}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No contact messages</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sponsors" className="mt-4">
            {loadingInquiries ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : sponsorInquiries && sponsorInquiries.length > 0 ? (
              <div className="space-y-3">
                {sponsorInquiries.map((inquiry) => (
                  <Card
                    key={inquiry.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleViewInquiry(inquiry)}
                    data-testid={`card-inquiry-${inquiry.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{inquiry.companyName}</span>
                            <Badge variant={inquiry.status === "new" ? "default" : "secondary"}>
                              {inquiry.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Contact: {inquiry.contactName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {inquiry.email} • {inquiry.budget ? `Budget: ${inquiry.budget}` : ""}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No sponsor inquiries</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact Message</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">From</p>
                  <p className="text-muted-foreground">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground">{selectedMessage.email}</p>
                </div>
                {selectedMessage.subject && (
                  <div>
                    <p className="text-sm font-medium">Subject</p>
                    <p className="text-muted-foreground">{selectedMessage.subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Message</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => openReplyToMessage(selectedMessage)}
                    data-testid="button-reply-message"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateContactMutation.mutate({ id: selectedMessage.id, status: "replied" });
                      setSelectedMessage(null);
                    }}
                    data-testid="button-mark-replied"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Replied
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`mailto:${selectedMessage.email}`)}
                    data-testid="button-external-email"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    External Email
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sponsor Inquiry</DialogTitle>
            </DialogHeader>
            {selectedInquiry && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <p className="text-muted-foreground">{selectedInquiry.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Contact</p>
                  <p className="text-muted-foreground">{selectedInquiry.contactName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground">{selectedInquiry.email}</p>
                </div>
                {selectedInquiry.phone && (
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-muted-foreground">{selectedInquiry.phone}</p>
                  </div>
                )}
                {selectedInquiry.budget && (
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-muted-foreground">{selectedInquiry.budget}</p>
                  </div>
                )}
                {selectedInquiry.message && (
                  <div>
                    <p className="text-sm font-medium">Message</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedInquiry.message}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => openReplyToInquiry(selectedInquiry)}
                    data-testid="button-reply-inquiry"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateInquiryMutation.mutate({ id: selectedInquiry.id, status: "converted" });
                      setSelectedInquiry(null);
                    }}
                    data-testid="button-mark-converted"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Converted
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`mailto:${selectedInquiry.email}`)}
                    data-testid="button-external-email-inquiry"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    External Email
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Compose Reply Dialog */}
        <Dialog open={!!replyToMessage || !!replyToInquiry} onOpenChange={(open) => !open && closeReplyDialog()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {replyToMessage ? `Reply to ${replyToMessage.name}` : replyToInquiry ? `Reply to ${replyToInquiry.contactName}` : "Compose Reply"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  To: {replyToMessage?.email || replyToInquiry?.email}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reply-subject">Subject</Label>
                <Input
                  id="reply-subject"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Email subject"
                  data-testid="input-reply-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reply-body">Message</Label>
                <Textarea
                  id="reply-body"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write your reply..."
                  rows={6}
                  className="resize-none"
                  data-testid="input-reply-body"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeReplyDialog} disabled={isSending}>
                Cancel
              </Button>
              <Button onClick={handleSendReply} disabled={isSending} data-testid="button-send-reply">
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Compose New Message Dialog */}
        <Dialog open={showCompose} onOpenChange={(open) => !open && closeComposeDialog()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="compose-email">To (Email Address)</Label>
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
              <Button variant="outline" onClick={closeComposeDialog} disabled={isSending}>
                Cancel
              </Button>
              <Button onClick={handleSendCompose} disabled={isSending} data-testid="button-send-compose">
                {isSending ? (
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
      </div>
    </AdminLayout>
  );
}
