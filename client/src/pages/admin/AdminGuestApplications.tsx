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
  DialogDescription,
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
  Users, Clock, CheckCircle, XCircle, Send, 
  Eye, Trash2, Loader2, Calendar, Mail, Phone,
  User, MapPin, Briefcase, Link as LinkIcon, ExternalLink
} from "lucide-react";
import { SiLinkedin, SiInstagram, SiYoutube } from "react-icons/si";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GuestApplication } from "@shared/schema";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  reviewing: "bg-blue-500",
  accepted: "bg-green-500",
  declined: "bg-red-500",
  scheduled: "bg-purple-500",
};

const roleLabels: Record<string, string> = {
  "business-owner": "Business Owner / Entrepreneur",
  "professional": "Professional / Expert",
  "author": "Author / Writer",
  "community-leader": "Community Leader",
  "rabbi": "Rabbi / Educator",
  "entertainer": "Entertainer / Musician",
  "public-figure": "Public Figure",
  "other": "Other",
};

export default function AdminGuestApplications() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedApplication, setSelectedApplication] = useState<GuestApplication | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [studioAddress, setStudioAddress] = useState("Latest Talks Studio, Brooklyn, NY");
  const { toast } = useToast();

  const { data: applications, isLoading } = useQuery<GuestApplication[]>({
    queryKey: ["/api/guest-applications"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<GuestApplication>) => {
      const res = await apiRequest("PATCH", `/api/guest-applications/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-applications"] });
      toast({ title: "Application updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/guest-applications/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-applications"] });
      toast({ title: "Application deleted" });
      setSelectedApplication(null);
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async ({ id, studioAddress }: { id: string; studioAddress: string }) => {
      const res = await apiRequest("POST", `/api/guest-applications/${id}/send-invite`, { studioAddress });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-applications"] });
      toast({ title: "Calendar invite sent!", description: "The guest has received their scheduling email." });
      setScheduleDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send invite", description: error.message, variant: "destructive" });
    },
  });

  const pendingCount = applications?.filter(a => a.status === "pending").length || 0;
  const reviewingCount = applications?.filter(a => a.status === "reviewing").length || 0;
  const acceptedCount = applications?.filter(a => a.status === "accepted" || a.status === "scheduled").length || 0;

  const filteredApplications = applications?.filter(a => {
    if (activeTab === "pending") return a.status === "pending" || a.status === "reviewing";
    if (activeTab === "accepted") return a.status === "accepted" || a.status === "scheduled";
    if (activeTab === "declined") return a.status === "declined";
    return true;
  }) || [];

  const handleAccept = (application: GuestApplication) => {
    updateMutation.mutate({ id: application.id, status: "accepted" });
  };

  const handleDecline = (application: GuestApplication) => {
    updateMutation.mutate({ id: application.id, status: "declined" });
  };

  const handleSchedule = (application: GuestApplication) => {
    setSelectedApplication(application);
    setScheduledDate(application.scheduledDate ? format(new Date(application.scheduledDate), "yyyy-MM-dd'T'HH:mm") : "");
    setStudioAddress(application.studioAddress || "Latest Talks Studio, Brooklyn, NY");
    setScheduleDialogOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!selectedApplication || !scheduledDate) return;
    
    updateMutation.mutate({
      id: selectedApplication.id,
      scheduledDate: new Date(scheduledDate),
      studioAddress,
      status: "scheduled",
    });
    setScheduleDialogOpen(false);
  };

  const handleSendInvite = () => {
    if (!selectedApplication) return;
    sendInviteMutation.mutate({ id: selectedApplication.id, studioAddress });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount + reviewingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{acceptedCount}</p>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{applications?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingCount + reviewingCount})
            </TabsTrigger>
            <TabsTrigger value="accepted" data-testid="tab-accepted">
              Accepted ({acceptedCount})
            </TabsTrigger>
            <TabsTrigger value="declined" data-testid="tab-declined">
              Declined
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              All
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No applications in this category</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedApplication(application)}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{application.fullName}</h3>
                            <Badge className={statusColors[application.status]}>
                              {application.status}
                            </Badge>
                            {application.calendarInviteSent && (
                              <Badge variant="outline" className="border-green-500 text-green-600">
                                Invite Sent
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {roleLabels[application.role] || application.role}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {application.email}
                            </span>
                            {application.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {application.phone}
                              </span>
                            )}
                          </div>
                          {application.scheduledDate && (
                            <div className="mt-2 text-sm">
                              <span className="flex items-center gap-1 text-primary">
                                <Calendar className="h-4 w-4" />
                                Scheduled: {format(new Date(application.scheduledDate), "PPP 'at' p")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {application.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleAccept(application); }}
                                disabled={updateMutation.isPending}
                                data-testid={`button-accept-${application.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleDecline(application); }}
                                disabled={updateMutation.isPending}
                                data-testid={`button-decline-${application.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                          {application.status === "accepted" && !application.scheduledDate && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleSchedule(application); }}
                              data-testid={`button-schedule-${application.id}`}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          )}
                          {application.status === "scheduled" && !application.calendarInviteSent && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setSelectedApplication(application); sendInviteMutation.mutate({ id: application.id, studioAddress: application.studioAddress || "Latest Talks Studio, Brooklyn, NY" }); }}
                              disabled={sendInviteMutation.isPending}
                              data-testid={`button-send-invite-${application.id}`}
                            >
                              {sendInviteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4 mr-1" />
                              )}
                              Send Invite
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); setSelectedApplication(application); }}
                            data-testid={`button-view-${application.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* View Application Dialog */}
      <Dialog open={!!selectedApplication && !scheduleDialogOpen} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <User className="h-5 w-5" />
              {selectedApplication?.fullName}
            </DialogTitle>
            <DialogDescription>
              Submitted {selectedApplication?.createdAt && format(new Date(selectedApplication.createdAt), "PPP 'at' p")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Status & Role */}
              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[selectedApplication.status]}>
                  {selectedApplication.status}
                </Badge>
                <Badge variant="outline">
                  {roleLabels[selectedApplication.role] || selectedApplication.role}
                </Badge>
                {selectedApplication.confirmationEmailSent && (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    Confirmation Sent
                  </Badge>
                )}
                {selectedApplication.calendarInviteSent && (
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    Calendar Invite Sent
                  </Badge>
                )}
              </div>

              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <a href={`mailto:${selectedApplication.email}`} className="ml-2 text-primary hover:underline">
                      {selectedApplication.email}
                    </a>
                  </div>
                  {selectedApplication.workEmail && (
                    <div>
                      <span className="text-muted-foreground">Work Email:</span>
                      <a href={`mailto:${selectedApplication.workEmail}`} className="ml-2 text-primary hover:underline">
                        {selectedApplication.workEmail}
                      </a>
                    </div>
                  )}
                  {selectedApplication.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2">{selectedApplication.phone}</span>
                    </div>
                  )}
                  {selectedApplication.cellPhone && (
                    <div>
                      <span className="text-muted-foreground">Cell:</span>
                      <span className="ml-2">{selectedApplication.cellPhone}</span>
                    </div>
                  )}
                  {selectedApplication.workPhone && (
                    <div>
                      <span className="text-muted-foreground">Work Phone:</span>
                      <span className="ml-2">{selectedApplication.workPhone}</span>
                    </div>
                  )}
                  {selectedApplication.address && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="ml-2">{selectedApplication.address}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Preferred Contact:</span>
                    <span className="ml-2 capitalize">{selectedApplication.preferredCommunication}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              {(selectedApplication.linkedinUrl || selectedApplication.instagramUrl || selectedApplication.youtubeUrl || selectedApplication.websiteUrl) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Social & Links</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    {selectedApplication.linkedinUrl && (
                      <a href={selectedApplication.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <SiLinkedin className="h-4 w-4" /> LinkedIn <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {selectedApplication.instagramUrl && (
                      <a href={selectedApplication.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <SiInstagram className="h-4 w-4" /> Instagram <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {selectedApplication.youtubeUrl && (
                      <a href={selectedApplication.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <SiYoutube className="h-4 w-4" /> YouTube <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {selectedApplication.websiteUrl && (
                      <a href={selectedApplication.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <LinkIcon className="h-4 w-4" /> Website <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Introduction */}
              {selectedApplication.introduction && (
                <div>
                  <Label className="text-base font-semibold">Introduction</Label>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{selectedApplication.introduction}</p>
                </div>
              )}

              {/* Previous Appearances */}
              {selectedApplication.previousAppearances && (
                <div>
                  <Label className="text-base font-semibold">Previous Appearances</Label>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{selectedApplication.previousAppearances}</p>
                </div>
              )}

              {/* Topics */}
              {selectedApplication.topicsOrQuestions && (
                <div>
                  <Label className="text-base font-semibold">Topics to Discuss</Label>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{selectedApplication.topicsOrQuestions}</p>
                </div>
              )}

              {/* Availability */}
              {selectedApplication.availability && (
                <div>
                  <Label className="text-base font-semibold">Availability</Label>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{selectedApplication.availability}</p>
                </div>
              )}

              {/* How they heard about us */}
              {selectedApplication.heardAboutUs && (
                <div>
                  <Label className="text-base font-semibold">How They Heard About Us</Label>
                  <p className="mt-2 text-sm text-muted-foreground capitalize">{selectedApplication.heardAboutUs}</p>
                </div>
              )}

              {/* Scheduled Info */}
              {selectedApplication.scheduledDate && (
                <Card className="border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Scheduled Recording
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p><strong>Date:</strong> {format(new Date(selectedApplication.scheduledDate), "PPPP 'at' p")}</p>
                    {selectedApplication.studioAddress && (
                      <p><strong>Location:</strong> {selectedApplication.studioAddress}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedApplication?.status === "pending" && (
              <>
                <Button onClick={() => handleAccept(selectedApplication)} disabled={updateMutation.isPending}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Accept
                </Button>
                <Button variant="outline" onClick={() => handleDecline(selectedApplication)} disabled={updateMutation.isPending}>
                  <XCircle className="h-4 w-4 mr-1" /> Decline
                </Button>
              </>
            )}
            {selectedApplication?.status === "accepted" && !selectedApplication.scheduledDate && (
              <Button onClick={() => handleSchedule(selectedApplication)}>
                <Calendar className="h-4 w-4 mr-1" /> Schedule Recording
              </Button>
            )}
            {selectedApplication?.status === "scheduled" && !selectedApplication.calendarInviteSent && (
              <Button onClick={handleSendInvite} disabled={sendInviteMutation.isPending}>
                {sendInviteMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Send Calendar Invite
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => selectedApplication && deleteMutation.mutate(selectedApplication.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Recording</DialogTitle>
            <DialogDescription>
              Set the date, time, and location for {selectedApplication?.fullName}'s recording session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Date & Time</Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                data-testid="input-scheduled-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studio-address">Studio Address</Label>
              <Textarea
                id="studio-address"
                value={studioAddress}
                onChange={(e) => setStudioAddress(e.target.value)}
                placeholder="Latest Talks Studio, Brooklyn, NY"
                className="resize-none"
                data-testid="input-studio-address"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule} disabled={!scheduledDate || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Schedule
            </Button>
            {selectedApplication?.scheduledDate && !selectedApplication.calendarInviteSent && (
              <Button onClick={handleSendInvite} disabled={sendInviteMutation.isPending}>
                {sendInviteMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Save & Send Invite
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
