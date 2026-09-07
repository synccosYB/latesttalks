import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Mail, Phone, Building, User, Clock, DollarSign, MessageSquare, CheckCircle, XCircle, CalendarPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";
import type { AdSlotRequest } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "meeting-scheduled": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const slotTypeLabels: Record<string, string> = {
  "prime-time": "Prime Time",
  "ad-break-1": "Ad Break 1",
  "ad-break-2": "Ad Break 2",
};

export default function AdSlotRequestsPage() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<AdSlotRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: requests = [], isLoading } = useQuery<AdSlotRequest[]>({
    queryKey: ["/api/ad-slot-requests"],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/ad-slot-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-slot-requests"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const scheduleMeeting = useMutation({
    mutationFn: async ({ id, meetingDate, meetingNotes }: { id: string; meetingDate: string; meetingNotes: string }) => {
      return apiRequest("PATCH", `/api/ad-slot-requests/${id}`, {
        status: "meeting-scheduled",
        meetingDate: new Date(meetingDate).toISOString(),
        meetingNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-slot-requests"] });
      toast({ title: "Meeting scheduled successfully" });
      setMeetingDialogOpen(false);
      setMeetingDate("");
      setMeetingNotes("");
    },
    onError: () => {
      toast({ title: "Failed to schedule meeting", variant: "destructive" });
    },
  });

  const updateAdminNotes = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes: string }) => {
      return apiRequest("PATCH", `/api/ad-slot-requests/${id}`, { adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-slot-requests"] });
      toast({ title: "Notes saved" });
    },
    onError: () => {
      toast({ title: "Failed to save notes", variant: "destructive" });
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/ad-slot-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-slot-requests"] });
      toast({ title: "Request deleted" });
      setDeleteDialogOpen(false);
      setDetailsOpen(false);
      setSelectedRequest(null);
    },
    onError: () => {
      toast({ title: "Failed to delete request", variant: "destructive" });
    },
  });

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "all") return true;
    return req.status === activeTab;
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const meetingCount = requests.filter(r => r.status === "meeting-scheduled").length;

  const openDetails = (request: AdSlotRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || "");
    setDetailsOpen(true);
  };

  const openMeetingDialog = (request: AdSlotRequest) => {
    setSelectedRequest(request);
    setMeetingDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Ad Slot Requests</h1>
            <p className="text-muted-foreground">Manage advertising slot requests from potential sponsors</p>
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {pendingCount} Pending
              </Badge>
            )}
            {meetingCount > 0 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {meetingCount} Meetings Scheduled
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({requests.filter(r => r.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="contacted">Contacted ({requests.filter(r => r.status === "contacted").length})</TabsTrigger>
            <TabsTrigger value="meeting-scheduled">Meetings ({requests.filter(r => r.status === "meeting-scheduled").length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({requests.filter(r => r.status === "approved").length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({requests.filter(r => r.status === "rejected").length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No requests found in this category.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => openDetails(request)}
                    data-testid={`card-request-${request.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start gap-4 justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{request.companyName}</span>
                            <Badge className={statusColors[request.status] || ""}>
                              {request.status.replace("-", " ")}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {request.contactName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {request.email}
                            </div>
                            {request.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {request.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-bold text-lg text-primary">
                            ${(request.pricePerEpisode * request.numberOfEpisodes).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {slotTypeLabels[request.slotType]} - Slot {request.slotNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.numberOfEpisodes} episode{request.numberOfEpisodes > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      
                      {request.message && (
                        <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-muted-foreground line-clamp-2">{request.message}</p>
                          </div>
                        </div>
                      )}
                      
                      {request.meetingDate && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-purple-600">
                          <Calendar className="h-4 w-4" />
                          Meeting: {format(new Date(request.meetingDate), "PPp")}
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {request.createdAt ? format(new Date(request.createdAt), "PP") : "Unknown date"}
                        </span>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {request.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateStatus.mutate({ id: request.id, status: "contacted" })}
                                data-testid={`button-contact-${request.id}`}
                              >
                                Mark Contacted
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => openMeetingDialog(request)}
                                data-testid={`button-schedule-${request.id}`}
                              >
                                <CalendarPlus className="h-4 w-4 mr-1" />
                                Schedule Meeting
                              </Button>
                            </>
                          )}
                          {request.status === "contacted" && (
                            <Button 
                              size="sm" 
                              onClick={() => openMeetingDialog(request)}
                              data-testid={`button-schedule-${request.id}`}
                            >
                              <CalendarPlus className="h-4 w-4 mr-1" />
                              Schedule Meeting
                            </Button>
                          )}
                          {request.status === "meeting-scheduled" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => updateStatus.mutate({ id: request.id, status: "approved" })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => updateStatus.mutate({ id: request.id, status: "rejected" })}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {selectedRequest.companyName}
                </DialogTitle>
                <DialogDescription>
                  Ad Slot Request Details
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <Select 
                    value={selectedRequest.status} 
                    onValueChange={(status) => {
                      updateStatus.mutate({ id: selectedRequest.id, status });
                      setSelectedRequest({ ...selectedRequest, status });
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="meeting-scheduled">Meeting Scheduled</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Contact Name</Label>
                    <p className="font-medium">{selectedRequest.contactName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <a href={`mailto:${selectedRequest.email}`} className="font-medium text-primary hover:underline block">
                      {selectedRequest.email}
                    </a>
                  </div>
                  {selectedRequest.phone && (
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <a href={`tel:${selectedRequest.phone}`} className="font-medium text-primary hover:underline block">
                        {selectedRequest.phone}
                      </a>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Submitted</Label>
                    <p className="font-medium">
                      {selectedRequest.createdAt ? format(new Date(selectedRequest.createdAt), "PPP") : "Unknown"}
                    </p>
                  </div>
                </div>
                
                {/* Slot Details */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Slot Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Ad Slot</Label>
                      <p className="font-medium">{slotTypeLabels[selectedRequest.slotType]} - Slot {selectedRequest.slotNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Price per Episode</Label>
                      <p className="font-medium">${selectedRequest.pricePerEpisode.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Number of Episodes</Label>
                      <p className="font-medium">{selectedRequest.numberOfEpisodes}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Value</Label>
                      <p className="font-bold text-lg text-primary">
                        ${(selectedRequest.pricePerEpisode * selectedRequest.numberOfEpisodes).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Customer Message */}
                {selectedRequest.message && (
                  <div>
                    <Label className="text-muted-foreground">Customer Message / Custom Requests</Label>
                    <p className="mt-1 p-3 bg-muted rounded-md">{selectedRequest.message}</p>
                  </div>
                )}
                
                {/* Meeting Info */}
                {selectedRequest.meetingDate && (
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">Meeting Scheduled</h4>
                    <p className="font-medium">{format(new Date(selectedRequest.meetingDate), "PPPp")}</p>
                    {selectedRequest.meetingNotes && (
                      <p className="mt-2 text-sm text-muted-foreground">{selectedRequest.meetingNotes}</p>
                    )}
                  </div>
                )}
                
                {/* Admin Notes */}
                <div>
                  <Label htmlFor="adminNotes">Admin Notes (Internal)</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this request..."
                    className="mt-1"
                  />
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => updateAdminNotes.mutate({ id: selectedRequest.id, adminNotes })}
                    disabled={updateAdminNotes.isPending}
                  >
                    Save Notes
                  </Button>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  {!selectedRequest.meetingDate && selectedRequest.status !== "approved" && selectedRequest.status !== "rejected" && (
                    <Button onClick={() => openMeetingDialog(selectedRequest)}>
                      <CalendarPlus className="h-4 w-4 mr-1" />
                      Schedule Meeting
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Set up a meeting with {selectedRequest?.companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meetingDate">Meeting Date & Time</Label>
              <Input
                id="meetingDate"
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                data-testid="input-meeting-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingNotes">Meeting Notes (optional)</Label>
              <Textarea
                id="meetingNotes"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Location, agenda, video call link..."
                data-testid="input-meeting-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedRequest && meetingDate) {
                  scheduleMeeting.mutate({
                    id: selectedRequest.id,
                    meetingDate,
                    meetingNotes,
                  });
                }
              }}
              disabled={!meetingDate || scheduleMeeting.isPending}
              data-testid="button-confirm-meeting"
            >
              {scheduleMeeting.isPending ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ad slot request from {selectedRequest?.companyName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedRequest && deleteRequest.mutate(selectedRequest.id)}
              disabled={deleteRequest.isPending}
            >
              {deleteRequest.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
