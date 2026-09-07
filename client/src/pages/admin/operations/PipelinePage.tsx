import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Pencil, Trash2, UserPlus, Calendar, MessageSquare, Contact, Phone, Mail, Globe, MapPin, Send, Clock, CheckCircle, AlertCircle, LayoutGrid, List } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertGuestPipelineSchema, type GuestPipeline, type InsertGuestPipeline } from "@shared/schema";
import { z } from "zod";

const formSchema = insertGuestPipelineSchema.extend({
  name: z.string().min(1, "Name is required"),
});

const statusOptions = [
  { value: "prospect", label: "Prospect", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "scheduled", label: "Scheduled", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "recorded", label: "Recorded", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "published", label: "Published", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

export default function PipelinePage() {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<GuestPipeline | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [schedulingGuest, setSchedulingGuest] = useState<GuestPipeline | null>(null);
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [studioAddress, setStudioAddress] = useState("Latest Talks Studio, 123 Main Street, Brooklyn, NY 11201");

  const { data: pipeline, isLoading } = useQuery<GuestPipeline[]>({
    queryKey: ["/api/guest-pipeline"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      recommendedBy: "",
      contactMethod: "",
      contactInfo: "",
      address: "",
      phone: "",
      cellPhone: "",
      workPhone: "",
      personalEmail: "",
      workEmail: "",
      linkedin: "",
      twitter: "",
      instagram: "",
      facebook: "",
      website: "",
      otherContact: "",
      notes: "",
      status: "prospect",
      priority: "medium",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGuestPipeline) => {
      return apiRequest("POST", "/api/guest-pipeline", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-pipeline"] });
      toast({ title: "Guest added to pipeline" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertGuestPipeline> }) => {
      return apiRequest("PATCH", `/api/guest-pipeline/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-pipeline"] });
      toast({ title: "Guest updated" });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/guest-pipeline/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-pipeline"] });
      toast({ title: "Guest removed from pipeline" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendSchedulingEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/guest-pipeline/${id}/send-scheduling-email`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-pipeline"] });
      toast({ title: "Confirmation email sent", description: "Guest will receive the scheduling details" });
      setIsSchedulingOpen(false);
      setSchedulingGuest(null);
    },
    onError: (error: Error) => {
      toast({ title: "Email failed", description: error.message, variant: "destructive" });
    },
  });

  const send1DayReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/guest-pipeline/${id}/send-1day-reminder`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-pipeline"] });
      toast({ title: "1-Day reminder sent" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send reminder", description: error.message, variant: "destructive" });
    },
  });

  const send2HourReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/guest-pipeline/${id}/send-2hour-reminder`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-pipeline"] });
      toast({ title: "2-Hour reminder sent" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send reminder", description: error.message, variant: "destructive" });
    },
  });

  const checkRemindersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/guest-pipeline/check-reminders");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-pipeline"] });
      toast({ title: "Reminders checked", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Error checking reminders", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: GuestPipeline) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description || "",
      recommendedBy: item.recommendedBy || "",
      contactMethod: item.contactMethod || "",
      contactInfo: item.contactInfo || "",
      address: item.address || "",
      phone: item.phone || "",
      cellPhone: item.cellPhone || "",
      workPhone: item.workPhone || "",
      personalEmail: item.personalEmail || "",
      workEmail: item.workEmail || "",
      linkedin: item.linkedin || "",
      twitter: item.twitter || "",
      instagram: item.instagram || "",
      facebook: item.facebook || "",
      website: item.website || "",
      otherContact: item.otherContact || "",
      notes: item.notes || "",
      status: item.status || "prospect",
      priority: item.priority || "medium",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this guest from the pipeline?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  const openSchedulingDialog = (guest: GuestPipeline) => {
    setSchedulingGuest(guest);
    // Pre-fill with existing values if available
    if (guest.scheduledDate) {
      const date = new Date(guest.scheduledDate);
      setScheduledDate(date.toISOString().split('T')[0]);
      setScheduledTime(date.toTimeString().slice(0, 5));
    } else {
      setScheduledDate("");
      setScheduledTime("");
    }
    setStudioAddress(guest.studioAddress || "Latest Talks Studio, 123 Main Street, Brooklyn, NY 11201");
    setIsSchedulingOpen(true);
  };

  const handleScheduleGuest = async () => {
    if (!schedulingGuest || !scheduledDate || !scheduledTime) {
      toast({ title: "Missing info", description: "Please enter date and time", variant: "destructive" });
      return;
    }

    // Combine date and time
    const dateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    
    // First update the guest with scheduling info
    await updateMutation.mutateAsync({
      id: schedulingGuest.id,
      data: {
        scheduledDate: dateTime.toISOString(),
        studioAddress: studioAddress,
        googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studioAddress)}`,
        status: "scheduled"
      }
    });

    // Then send the confirmation email
    sendSchedulingEmailMutation.mutate(schedulingGuest.id);
  };

  const hasGuestEmail = (guest: GuestPipeline) => {
    return !!guest.personalEmail || !!guest.workEmail;
  };

  const openNewDialog = () => {
    setEditingItem(null);
    form.reset({
      name: "",
      description: "",
      recommendedBy: "",
      contactMethod: "",
      contactInfo: "",
      address: "",
      phone: "",
      cellPhone: "",
      workPhone: "",
      personalEmail: "",
      workEmail: "",
      linkedin: "",
      twitter: "",
      instagram: "",
      facebook: "",
      website: "",
      otherContact: "",
      notes: "",
      status: "prospect",
      priority: "medium",
    });
    setIsDialogOpen(true);
  };

  const filteredPipeline = pipeline?.filter(item => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (filterPriority !== "all" && item.priority !== filterPriority) return false;
    return true;
  }) || [];

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || "bg-gray-100 text-gray-700";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-pipeline-title">
              <UserPlus className="h-6 w-6" />
              Guest Pipeline
            </h1>
            <p className="text-muted-foreground">Track potential guests from prospect to published episode</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} data-testid="button-add-pipeline">
                <Plus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Guest" : "Add Guest to Pipeline"}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h3>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-pipeline-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic/Expertise</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="What they would talk about" data-testid="input-pipeline-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || "prospect"}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-pipeline-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {statusOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || "medium"}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-pipeline-priority">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="recommendedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recommended By</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="Who suggested this guest?" data-testid="input-pipeline-recommended" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Phone Numbers */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone Numbers
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Main Phone</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="Main number" data-testid="input-pipeline-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cellPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cell Phone</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="Cell number" data-testid="input-pipeline-cell" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="workPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Phone</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="Work number" data-testid="input-pipeline-work-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Email Addresses */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Email Addresses
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="personalEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personal Email</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} type="email" placeholder="personal@email.com" data-testid="input-pipeline-personal-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="workEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Email</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} type="email" placeholder="work@company.com" data-testid="input-pipeline-work-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Social Media */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Social Media & Online
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="linkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="linkedin.com/in/username" data-testid="input-pipeline-linkedin" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="twitter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Twitter/X</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="@username" data-testid="input-pipeline-twitter" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="instagram"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instagram</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="@username" data-testid="input-pipeline-instagram" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="facebook"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facebook</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="facebook.com/username" data-testid="input-pipeline-facebook" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="https://example.com" data-testid="input-pipeline-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Address & Other */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Address & Other
                      </h3>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} rows={2} placeholder="Full mailing address" data-testid="input-pipeline-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Contact</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-pipeline-contact-method">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="phone">Phone</SelectItem>
                                  <SelectItem value="cell">Cell Phone</SelectItem>
                                  <SelectItem value="social">Social Media</SelectItem>
                                  <SelectItem value="referral">Through Referral</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="otherContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Contact Method</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="Any other way to reach them" data-testid="input-pipeline-other-contact" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Notes */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Notes</h3>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} rows={3} placeholder="Additional notes about this guest..." data-testid="input-pipeline-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-pipeline">
                      {editingItem ? "Update Guest" : "Add Guest"}
                    </Button>
                  </form>
                </Form>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Scheduling Dialog */}
          <Dialog open={isSchedulingOpen} onOpenChange={setIsSchedulingOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Recording - {schedulingGuest?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-date">Date *</Label>
                    <Input
                      id="scheduled-date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      data-testid="input-scheduled-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-time">Time *</Label>
                    <Input
                      id="scheduled-time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      data-testid="input-scheduled-time"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studio-address">Studio Address</Label>
                  <Textarea
                    id="studio-address"
                    value={studioAddress}
                    onChange={(e) => setStudioAddress(e.target.value)}
                    rows={2}
                    placeholder="Enter studio address"
                    data-testid="input-studio-address"
                  />
                </div>
                {schedulingGuest && !hasGuestEmail(schedulingGuest) && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>No email address on file. Add one to send confirmations.</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={handleScheduleGuest}
                    disabled={updateMutation.isPending || sendSchedulingEmailMutation.isPending}
                    data-testid="button-schedule-and-send"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendSchedulingEmailMutation.isPending ? "Sending..." : "Schedule & Send Email"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Label>Filter:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40" data-testid="select-filter-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="rounded-r-none"
              data-testid="button-view-card"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => checkRemindersMutation.mutate()}
            disabled={checkRemindersMutation.isPending}
            data-testid="button-check-reminders"
          >
            <Clock className="h-4 w-4 mr-2" />
            {checkRemindersMutation.isPending ? "Checking..." : "Send Due Reminders"}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : filteredPipeline.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No guests in the pipeline. Add your first potential guest to get started.
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          /* List View */
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Topic</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Priority</th>
                    <th className="text-left p-3 font-medium">Contact</th>
                    <th className="text-left p-3 font-medium">Scheduled</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPipeline.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30" data-testid={`row-pipeline-${item.id}`}>
                      <td className="p-3">
                        <div className="font-medium">{item.name}</div>
                        {item.recommendedBy && (
                          <div className="text-xs text-muted-foreground">via {item.recommendedBy}</div>
                        )}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">
                        {item.description || "-"}
                      </td>
                      <td className="p-3">
                        <Select value={item.status} onValueChange={(value) => handleStatusChange(item.id, value)}>
                          <SelectTrigger className="w-32 h-8" data-testid={`select-list-status-${item.id}`}>
                            <Badge className={`${getStatusColor(item.status)} text-xs`} variant="secondary">
                              {statusOptions.find(s => s.value === item.status)?.label || item.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getPriorityColor(item.priority || "medium")} text-xs`} variant="secondary">
                          {item.priority || "medium"}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {(item.personalEmail || item.workEmail) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {item.personalEmail || item.workEmail}
                            </span>
                          )}
                          {(item.phone || item.cellPhone) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {item.cellPhone || item.phone}
                            </span>
                          )}
                          {!item.personalEmail && !item.workEmail && !item.phone && !item.cellPhone && "-"}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {item.scheduledDate ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-purple-600 dark:text-purple-400 font-medium text-xs">
                              {new Date(item.scheduledDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                            {item.status === "scheduled" && (
                              <div className="flex gap-1">
                                <Badge variant="outline" className={`text-xs px-1 ${item.scheduledEmailSent ? "text-green-600 border-green-600" : "text-gray-400"}`}>
                                  {item.scheduledEmailSent ? <CheckCircle className="h-2 w-2" /> : <Clock className="h-2 w-2" />}
                                </Badge>
                                <Badge variant="outline" className={`text-xs px-1 ${item.reminder1DaySent ? "text-green-600 border-green-600" : "text-gray-400"}`}>
                                  1D
                                </Badge>
                                <Badge variant="outline" className={`text-xs px-1 ${item.reminder2HoursSent ? "text-green-600 border-green-600" : "text-gray-400"}`}>
                                  2H
                                </Badge>
                              </div>
                            )}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSchedulingDialog(item)} title="Schedule" data-testid={`button-list-schedule-${item.id}`}>
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)} title="Edit" data-testid={`button-list-edit-${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)} title="Delete" data-testid={`button-list-delete-${item.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* Card View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPipeline.map((item) => (
              <Card key={item.id} className="overflow-hidden" data-testid={`card-pipeline-${item.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-pipeline-${item.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} data-testid={`button-delete-pipeline-${item.id}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getStatusColor(item.status)} variant="secondary">
                      {statusOptions.find(s => s.value === item.status)?.label || item.status}
                    </Badge>
                    <Badge className={getPriorityColor(item.priority || "medium")} variant="secondary">
                      {item.priority || "medium"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.description && (
                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <span>{item.description}</span>
                    </div>
                  )}
                  {item.contactInfo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Contact className="h-4 w-4" />
                      <span>{item.contactMethod ? `${item.contactMethod}: ` : ""}{item.contactInfo}</span>
                    </div>
                  )}
                  {item.scheduledDate && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {new Date(item.scheduledDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  {item.lastContactDate && !item.scheduledDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last contact: {new Date(item.lastContactDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {item.recommendedBy && (
                    <p className="text-xs text-muted-foreground">Recommended by: {item.recommendedBy}</p>
                  )}
                  
                  {/* Email status indicators */}
                  {item.status === "scheduled" && (
                    <div className="flex flex-wrap gap-1 text-xs">
                      <Badge variant="outline" className={item.scheduledEmailSent ? "text-green-600 border-green-600" : "text-gray-400"}>
                        {item.scheduledEmailSent ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        Confirmation
                      </Badge>
                      <Badge variant="outline" className={item.reminder1DaySent ? "text-green-600 border-green-600" : "text-gray-400"}>
                        {item.reminder1DaySent ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        1-Day
                      </Badge>
                      <Badge variant="outline" className={item.reminder2HoursSent ? "text-green-600 border-green-600" : "text-gray-400"}>
                        {item.reminder2HoursSent ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        2-Hour
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Select value={item.status} onValueChange={(value) => handleStatusChange(item.id, value)}>
                      <SelectTrigger className="flex-1" data-testid={`select-change-status-${item.id}`}>
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openSchedulingDialog(item)}
                      title="Schedule Recording"
                      data-testid={`button-schedule-${item.id}`}
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Manual reminder buttons for scheduled guests */}
                  {item.status === "scheduled" && item.scheduledDate && hasGuestEmail(item) && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => send1DayReminderMutation.mutate(item.id)}
                        disabled={send1DayReminderMutation.isPending}
                        data-testid={`button-send-1day-${item.id}`}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        1-Day Reminder
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => send2HourReminderMutation.mutate(item.id)}
                        disabled={send2HourReminderMutation.isPending}
                        data-testid={`button-send-2hour-${item.id}`}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        2-Hour Reminder
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
