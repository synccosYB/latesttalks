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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Pencil, Trash2, Handshake, DollarSign } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertSponsorDealSchema, type SponsorDeal, type InsertSponsorDeal, type Sponsor } from "@shared/schema";
import { z } from "zod";

const formSchema = insertSponsorDealSchema.extend({
  dealName: z.string().min(1, "Deal name is required"),
  sponsorId: z.string().min(1, "Sponsor is required"),
  amount: z.number().min(0, "Amount must be positive"),
});

export default function DealsPage() {
  const { toast } = useToast();
  const [editingDeal, setEditingDeal] = useState<SponsorDeal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: deals, isLoading } = useQuery<SponsorDeal[]>({
    queryKey: ["/api/sponsor-deals"],
  });

  const { data: sponsors } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealName: "",
      sponsorId: "",
      dealType: "episode_sponsorship",
      amount: 0,
      commission: undefined,
      status: "pending",
      startDate: undefined,
      endDate: undefined,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSponsorDeal) => {
      return apiRequest("/api/sponsor-deals", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor-deals"] });
      toast({ title: "Deal created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSponsorDeal> }) => {
      return apiRequest(`/api/sponsor-deals/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor-deals"] });
      toast({ title: "Deal updated successfully" });
      setIsDialogOpen(false);
      setEditingDeal(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/sponsor-deals/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor-deals"] });
      toast({ title: "Deal deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (deal: SponsorDeal) => {
    setEditingDeal(deal);
    form.reset({
      dealName: deal.dealName,
      sponsorId: deal.sponsorId,
      dealType: deal.dealType || "episode_sponsorship",
      amount: Number(deal.amount || 0),
      commission: deal.commission ? Number(deal.commission) : undefined,
      status: deal.status || "pending",
      startDate: deal.startDate || undefined,
      endDate: deal.endDate || undefined,
      notes: deal.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this deal?")) {
      deleteMutation.mutate(id);
    }
  };

  const openNewDialog = () => {
    setEditingDeal(null);
    form.reset({
      dealName: "",
      sponsorId: "",
      dealType: "episode_sponsorship",
      amount: 0,
      commission: undefined,
      status: "pending",
      startDate: undefined,
      endDate: undefined,
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const filteredDeals = deals?.filter(d => 
    filterStatus === "all" || d.status === filterStatus
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "completed": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "paid": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const totalValue = filteredDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalCommission = filteredDeals.reduce((sum, d) => sum + Number(d.commission || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-deals-title">
              <Handshake className="h-6 w-6" />
              Sponsor Deals
            </h1>
            <p className="text-muted-foreground">Manage sponsorship deals and track revenue</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} data-testid="button-add-deal">
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingDeal ? "Edit Deal" : "Create New Deal"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dealName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Q1 2024 Episode Package" data-testid="input-deal-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sponsorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sponsor *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-deal-sponsor">
                              <SelectValue placeholder="Select sponsor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sponsors?.map(sponsor => (
                              <SelectItem key={sponsor.id} value={sponsor.id}>{sponsor.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dealType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deal Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "episode_sponsorship"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-deal-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="episode_sponsorship">Episode Sponsorship</SelectItem>
                              <SelectItem value="series_sponsorship">Series Sponsorship</SelectItem>
                              <SelectItem value="ad_read">Ad Read</SelectItem>
                              <SelectItem value="product_placement">Product Placement</SelectItem>
                              <SelectItem value="affiliate">Affiliate</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "pending"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-deal-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($) *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-deal-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="commission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission ($)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value || ""}
                              data-testid="input-deal-commission"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} data-testid="input-deal-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-deal">
                    {editingDeal ? "Update Deal" : "Create Deal"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Deal Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${totalCommission.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deals?.filter(d => d.status === "active").length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <Label>Filter by status:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40" data-testid="select-filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No deals found. Create your first deal to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal Name</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => (
                    <TableRow key={deal.id} data-testid={`row-deal-${deal.id}`}>
                      <TableCell className="font-medium">{deal.dealName}</TableCell>
                      <TableCell>{sponsors?.find(s => s.id === deal.sponsorId)?.name || "Unknown"}</TableCell>
                      <TableCell className="capitalize">{deal.dealType?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        ${Number(deal.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {deal.commission ? `$${Number(deal.commission).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(deal.status || "pending")} variant="secondary">
                          {deal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(deal)} data-testid={`button-edit-deal-${deal.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(deal.id)} data-testid={`button-delete-deal-${deal.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
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
    </AdminLayout>
  );
}
