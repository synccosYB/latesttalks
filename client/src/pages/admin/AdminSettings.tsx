import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, UserPlus, Shield, Eye, EyeOff, Trash2, User, Mail, Send, RefreshCw, Youtube, CreditCard, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [testEmailForm, setTestEmailForm] = useState({
    to: "",
    subject: "Test Email from Latest Talks",
    message: "This is a test email to verify that our email system is working correctly.\n\nIf you received this email, the configuration is successful!",
  });

  const { data: users, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: youtubeStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/youtube/status"],
  });

  const { data: stripeStatus, refetch: refetchStripeStatus } = useQuery<{ 
    configured: boolean;
    hasApiKey: boolean;
    hasPriceId: boolean;
    hasWebhookSecret: boolean;
    priceId: string | null;
  }>({
    queryKey: ["/api/stripe/status"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newAdminForm) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Admin Added",
        description: "New admin user has been created successfully.",
      });
      setIsAddAdminOpen(false);
      setNewAdminForm({ name: "", email: "", password: "", role: "admin" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Deleted",
        description: "User has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async (data: typeof testEmailForm) => {
      const res = await apiRequest("POST", "/api/marketing/test-email", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: `Email sent successfully to ${testEmailForm.to}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Email",
        description: error.message || "There was a problem sending the test email",
        variant: "destructive",
      });
    },
  });

  const syncYouTubeViewsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/youtube/sync-views");
      return res.json();
    },
    onSuccess: (data: { message: string; updated: number; total: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      toast({
        title: "YouTube Views Synced",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync YouTube views",
        variant: "destructive",
      });
    },
  });

  const setupStripeProductsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/setup-products");
      return res.json();
    },
    onSuccess: (data: { success: boolean; message: string; prices: { monthly: { id: string }; annual: { id: string }; donation: { id: string }; giftMonthly: { id: string }; giftAnnual: { id: string } } }) => {
      refetchStripeStatus();
      toast({
        title: "All Products Created",
        description: `Subscription, Donation, and Gift products created. Monthly price ID: ${data.prices.monthly.id}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create Stripe products",
        variant: "destructive",
      });
    },
  });

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newAdminForm);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === user?.id) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }
    if (confirm(`Are you sure you want to delete ${userName}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailForm.to || !testEmailForm.subject || !testEmailForm.message) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    sendTestEmailMutation.mutate(testEmailForm);
  };

  const admins = users?.filter(u => u.role === "admin") || [];
  const otherUsers = users?.filter(u => u.role !== "admin") || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Settings className="h-6 w-6" />
            Admin Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your profile and admin users
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Profile
              </CardTitle>
              <CardDescription>
                Your current admin account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {user?.name?.split(" ").map(n => n[0]).join("") || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold" data-testid="text-user-name">{user?.name}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge className="mt-1" data-testid="badge-user-role">
                    <Shield className="h-3 w-3 mr-1" />
                    {user?.role}
                  </Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                To change your password or update your profile, contact the site administrator.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Users
                  </CardTitle>
                  <CardDescription>
                    {admins.length} admin{admins.length !== 1 ? "s" : ""} with access
                  </CardDescription>
                </div>
                <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-admin">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Admin</DialogTitle>
                      <DialogDescription>
                        Create a new admin account with full access to the admin portal.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddAdmin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={newAdminForm.name}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                          required
                          data-testid="input-new-admin-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@latesttalks.com"
                          value={newAdminForm.email}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                          required
                          data-testid="input-new-admin-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Create a secure password"
                            value={newAdminForm.password}
                            onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                            required
                            className="pr-10"
                            data-testid="input-new-admin-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={newAdminForm.role}
                          onValueChange={(value) => setNewAdminForm({ ...newAdminForm, role: value })}
                        >
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddAdminOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-submit-admin">
                          {createUserMutation.isPending ? "Creating..." : "Create Admin"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading users...</p>
              ) : admins.length === 0 ? (
                <p className="text-muted-foreground">No admin users found.</p>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div 
                      key={admin.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                      data-testid={`admin-user-${admin.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {admin.name?.split(" ").map(n => n[0]).join("") || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{admin.name}</p>
                          <p className="text-xs text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                      {admin.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(admin.id, admin.name || "this user")}
                          data-testid={`button-delete-admin-${admin.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      {admin.id === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Test Email
            </CardTitle>
            <CardDescription>
              Send a test email to verify your email configuration before mass mailing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email-to">Recipient Email</Label>
                <Input
                  id="test-email-to"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmailForm.to}
                  onChange={(e) => setTestEmailForm({ ...testEmailForm, to: e.target.value })}
                  required
                  data-testid="input-test-email-to"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-email-subject">Subject</Label>
                <Input
                  id="test-email-subject"
                  placeholder="Email subject"
                  value={testEmailForm.subject}
                  onChange={(e) => setTestEmailForm({ ...testEmailForm, subject: e.target.value })}
                  required
                  data-testid="input-test-email-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-email-message">Message</Label>
                <Textarea
                  id="test-email-message"
                  placeholder="Enter your test message..."
                  value={testEmailForm.message}
                  onChange={(e) => setTestEmailForm({ ...testEmailForm, message: e.target.value })}
                  rows={4}
                  required
                  data-testid="input-test-email-message"
                />
              </div>
              <Button 
                type="submit" 
                disabled={sendTestEmailMutation.isPending}
                data-testid="button-send-test-email"
              >
                {sendTestEmailMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5" />
              YouTube Views Sync
            </CardTitle>
            <CardDescription>
              Sync view counts from YouTube to display actual video statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={youtubeStatus?.configured ? "default" : "secondary"}>
                {youtubeStatus?.configured ? "API Configured" : "API Not Configured"}
              </Badge>
            </div>
            {!youtubeStatus?.configured && (
              <p className="text-sm text-muted-foreground">
                To sync YouTube views, add a <code className="bg-muted px-1 rounded">YOUTUBE_API_KEY</code> to your secrets. 
                Get one free from the Google Cloud Console.
              </p>
            )}
            <Button 
              onClick={() => syncYouTubeViewsMutation.mutate()}
              disabled={!youtubeStatus?.configured || syncYouTubeViewsMutation.isPending}
              data-testid="button-sync-youtube-views"
            >
              {syncYouTubeViewsMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync YouTube Views
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Payment Products
            </CardTitle>
            <CardDescription>
              Set up subscriptions, donations, and gift subscriptions for Latest Talks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={stripeStatus?.hasApiKey ? "default" : "secondary"}>
                {stripeStatus?.hasApiKey ? <><Check className="h-3 w-3 mr-1" /> API Key</> : "No API Key"}
              </Badge>
              <Badge variant={stripeStatus?.hasPriceId ? "default" : "secondary"}>
                {stripeStatus?.hasPriceId ? <><Check className="h-3 w-3 mr-1" /> Price ID</> : "No Price ID"}
              </Badge>
              <Badge variant={stripeStatus?.hasWebhookSecret ? "default" : "outline"}>
                {stripeStatus?.hasWebhookSecret ? <><Check className="h-3 w-3 mr-1" /> Webhook</> : "No Webhook (optional)"}
              </Badge>
            </div>
            
            {!stripeStatus?.hasApiKey && (
              <p className="text-sm text-muted-foreground">
                Add your <code className="bg-muted px-1 rounded">STRIPE_SECRET_KEY</code> and <code className="bg-muted px-1 rounded">STRIPE_PUBLISHABLE_KEY</code> to secrets first.
              </p>
            )}
            
            {stripeStatus?.hasApiKey && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Click below to create or update all payment products in Stripe:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>LT+ Subscription:</strong> $9.99/month or $119.99/year</li>
                  <li><strong>Donations:</strong> Custom amount (any amount)</li>
                  <li><strong>Gift Subscriptions:</strong> Buy LT+ for a friend or family</li>
                </ul>
                <Button 
                  onClick={() => setupStripeProductsMutation.mutate()}
                  disabled={setupStripeProductsMutation.isPending}
                  data-testid="button-setup-stripe-products"
                >
                  {setupStripeProductsMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Products...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {stripeStatus?.hasPriceId ? "Update Stripe Products" : "Create Stripe Products"}
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {stripeStatus?.configured && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Stripe is configured! Subscriptions, donations, and gifts are ready.
                </p>
                {stripeStatus.priceId && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Price ID: {stripeStatus.priceId}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {otherUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Other Users</CardTitle>
              <CardDescription>
                Non-admin users with limited access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === "active" ? "default" : "outline"}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(u.id, u.name || "this user")}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
