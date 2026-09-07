import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Bug, AlertCircle, Clock, CheckCircle, XCircle, Send, 
  Eye, Trash2, MessageSquare, Loader2, Monitor, Smartphone,
  Globe, User, Mail, Calendar, ExternalLink
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BugReport, User as AdminUser } from "@shared/schema";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  open: "bg-blue-500",
  "in-progress": "bg-yellow-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
  "wont-fix": "bg-red-500",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  critical: "bg-red-600",
};

const categoryLabels: Record<string, string> = {
  general: "General",
  playback: "Video/Audio Playback",
  navigation: "Navigation",
  account: "Account Issues",
  payment: "Payment/Subscription",
  other: "Other",
};

export default function AdminBugReports() {
  const [activeTab, setActiveTab] = useState("open");
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [replyToReport, setReplyToReport] = useState<BugReport | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [editingReport, setEditingReport] = useState<BugReport | null>(null);
  const { toast } = useToast();

  const { data: reports, isLoading } = useQuery<BugReport[]>({
    queryKey: ["/api/bug-reports"],
  });

  const { data: adminUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  // Mark all bug reports as read when page loads
  useEffect(() => {
    if (reports && reports.some(r => r.isRead === false)) {
      apiRequest("POST", "/api/bug-reports/mark-all-read")
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
        })
        .catch(() => {});
    }
  }, [reports]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<BugReport>) => {
      const res = await apiRequest("PATCH", `/api/bug-reports/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
      toast({ title: "Bug report updated" });
      setEditingReport(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/bug-reports/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
      toast({ title: "Bug report deleted" });
      setSelectedReport(null);
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, subject, message }: { id: string; subject: string; message: string }) => {
      const res = await apiRequest("POST", `/api/bug-reports/${id}/reply`, { subject, message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bug-reports"] });
      toast({ title: "Reply sent successfully" });
      setReplyToReport(null);
      setReplySubject("");
      setReplyBody("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send reply", description: error.message, variant: "destructive" });
    },
  });

  const openCount = reports?.filter(r => r.status === "open").length || 0;
  const inProgressCount = reports?.filter(r => r.status === "in-progress").length || 0;
  const resolvedCount = reports?.filter(r => r.status === "resolved" || r.status === "closed").length || 0;
  const criticalCount = reports?.filter(r => r.priority === "critical" && r.status === "open").length || 0;

  const filteredReports = reports?.filter(r => {
    if (activeTab === "open") return r.status === "open";
    if (activeTab === "in-progress") return r.status === "in-progress";
    if (activeTab === "resolved") return r.status === "resolved" || r.status === "closed" || r.status === "wont-fix";
    if (activeTab === "critical") return r.priority === "critical";
    return true;
  }) || [];

  const openReplyDialog = (report: BugReport) => {
    setReplyToReport(report);
    setReplySubject(`Re: Bug Report - ${report.title}`);
    setReplyBody("");
  };

  const handleSendReply = () => {
    if (!replyToReport) return;
    replyMutation.mutate({
      id: replyToReport.id,
      subject: replySubject,
      message: replyBody,
    });
  };

  const handleStatusChange = (report: BugReport, newStatus: string) => {
    updateMutation.mutate({ id: report.id, status: newStatus });
  };

  const handlePriorityChange = (report: BugReport, newPriority: string) => {
    updateMutation.mutate({ id: report.id, priority: newPriority });
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bug className="h-6 w-6 text-primary" />
              Bug Reports
            </h1>
            <p className="text-muted-foreground text-sm">Manage user-submitted bug reports and issues</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{openCount}</p>
                  <p className="text-xs text-muted-foreground">Open Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resolvedCount}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{criticalCount}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="open" data-testid="tab-open">
              Open {openCount > 0 && <Badge variant="secondary" className="ml-1">{openCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="in-progress" data-testid="tab-in-progress">
              In Progress {inProgressCount > 0 && <Badge variant="secondary" className="ml-1">{inProgressCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="resolved" data-testid="tab-resolved">Resolved</TabsTrigger>
            <TabsTrigger value="critical" data-testid="tab-critical">
              Critical {criticalCount > 0 && <Badge variant="destructive" className="ml-1">{criticalCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No bug reports in this category</p>
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report) => (
                <Card 
                  key={report.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                  data-testid={`card-bug-report-${report.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${priorityColors[report.priority]} text-white text-xs`}>
                            {report.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[report.category] || report.category}
                          </Badge>
                          <Badge className={`${statusColors[report.status]} text-white text-xs`}>
                            {report.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold truncate">{report.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{report.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {report.reporterName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {report.reporterName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {report.createdAt ? format(new Date(report.createdAt), "MMM d, yyyy") : "N/A"}
                          </span>
                          {report.browser && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {report.browser}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {report.reporterEmail && (
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); openReplyDialog(report); }}
                            data-testid={`button-reply-${report.id}`}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                          data-testid={`button-view-${report.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* View Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Bug Report Details
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={`${priorityColors[selectedReport.priority]} text-white`}>
                  {selectedReport.priority} priority
                </Badge>
                <Badge className={`${statusColors[selectedReport.status]} text-white`}>
                  {selectedReport.status}
                </Badge>
                <Badge variant="outline">
                  {categoryLabels[selectedReport.category] || selectedReport.category}
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-lg">{selectedReport.title}</h3>
                <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Reporter</Label>
                  <p className="font-medium">{selectedReport.reporterName || "Anonymous"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedReport.reporterEmail || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Browser</Label>
                  <p className="font-medium">{selectedReport.browser || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Device</Label>
                  <p className="font-medium">{selectedReport.device || "Unknown"}</p>
                </div>
                {selectedReport.pageUrl && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Page URL</Label>
                    <a 
                      href={selectedReport.pageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {selectedReport.pageUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium">
                    {selectedReport.createdAt ? format(new Date(selectedReport.createdAt), "PPP 'at' p") : "N/A"}
                  </p>
                </div>
                {selectedReport.respondedAt && (
                  <div>
                    <Label className="text-muted-foreground">Responded</Label>
                    <p className="font-medium">
                      {format(new Date(selectedReport.respondedAt), "PPP 'at' p")}
                    </p>
                  </div>
                )}
              </div>

              {/* Status and Priority Controls */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Status</Label>
                  <Select 
                    value={selectedReport.status} 
                    onValueChange={(val) => handleStatusChange(selectedReport, val)}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="wont-fix">Won't Fix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Priority</Label>
                  <Select 
                    value={selectedReport.priority} 
                    onValueChange={(val) => handlePriorityChange(selectedReport, val)}
                  >
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <Label>Admin Notes (Internal)</Label>
                <Textarea
                  value={selectedReport.adminNotes || ""}
                  onChange={(e) => setSelectedReport({ ...selectedReport, adminNotes: e.target.value })}
                  placeholder="Add internal notes about this bug..."
                  className="mt-1"
                  rows={3}
                  data-testid="textarea-admin-notes"
                />
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => updateMutation.mutate({ id: selectedReport.id, adminNotes: selectedReport.adminNotes })}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-notes"
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save Notes
                </Button>
              </div>

              {selectedReport.adminResponse && (
                <div className="bg-muted p-3 rounded-lg">
                  <Label className="text-muted-foreground">Last Response Sent</Label>
                  <p className="text-sm mt-1">{selectedReport.adminResponse}</p>
                </div>
              )}

              <DialogFooter className="gap-2">
                {selectedReport.reporterEmail && (
                  <Button variant="outline" onClick={() => openReplyDialog(selectedReport)} data-testid="button-send-reply">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={() => deleteMutation.mutate(selectedReport.id)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-report"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={!!replyToReport} onOpenChange={() => setReplyToReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Reply to Bug Report
            </DialogTitle>
          </DialogHeader>
          {replyToReport && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">{replyToReport.title}</p>
                <p className="text-xs text-muted-foreground">To: {replyToReport.reporterEmail}</p>
              </div>
              <div>
                <Label>Subject</Label>
                <Input 
                  value={replySubject} 
                  onChange={(e) => setReplySubject(e.target.value)}
                  data-testid="input-reply-subject"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your response..."
                  rows={6}
                  data-testid="textarea-reply-message"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReplyToReport(null)}>Cancel</Button>
                <Button 
                  onClick={handleSendReply}
                  disabled={!replySubject || !replyBody || replyMutation.isPending}
                  data-testid="button-send-reply-confirm"
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Reply
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
