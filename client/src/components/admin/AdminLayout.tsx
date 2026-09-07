import { useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Video,
  Users,
  UserCheck,
  Mail,
  MessageSquare,
  DollarSign,
  LogOut,
  Home,
  Crown,
  Camera,
  Megaphone,
  Settings,
  Briefcase,
  UsersRound,
  UserPlus,
  Receipt,
  TrendingUp,
  Handshake,
  FolderKanban,
  MessageCircle,
  Bug,
  ClipboardList,
  BarChart3,
  Image,
  Monitor,
  TicketCheck,
} from "lucide-react";
import logoUrl from "@assets/logo.jpg";

const overviewItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

const contentItems = [
  { href: "/admin/episodes", label: "Episodes", icon: Video },
  { href: "/admin/guests", label: "Guests", icon: Users },
  { href: "/admin/sponsors", label: "Sponsors", icon: DollarSign },
  { href: "/admin/media", label: "Media Library", icon: Image },
  { href: "/admin/platforms", label: "Platforms", icon: Monitor },
];

const audienceItems = [
  { href: "/admin/subscribers", label: "Subscribers", icon: UserCheck },
  { href: "/admin/members", label: "LT+ Members", icon: Crown },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
];

const communityItems = [
  { href: "/admin/photos", label: "Community Photos", icon: Camera },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/guest-applications", label: "Guest Applications", icon: ClipboardList },
  { href: "/admin/bug-reports", label: "Bug Reports", icon: Bug },
];

const businessItems = [
  { href: "/admin/event-tickets", label: "Event Tickets", icon: TicketCheck },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { href: "/admin/ad-requests", label: "Ad Slot Requests", icon: DollarSign },
];

const operationsItems = [
  { href: "/admin/operations", label: "Operations", icon: Briefcase },
  { href: "/admin/operations/episodes", label: "Episodes Ops", icon: Video },
  { href: "/admin/operations/team", label: "Team", icon: UsersRound },
  { href: "/admin/operations/pipeline", label: "Guest Pipeline", icon: UserPlus },
  { href: "/admin/operations/deals", label: "Sponsor Deals", icon: Handshake },
  { href: "/admin/operations/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/operations/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/operations/finances", label: "Finances", icon: TrendingUp },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: notificationCounts } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/notifications"],
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    staleTime: 15000,
  });

  const sectionRoutes: { prefix: string; key: string }[] = [
    { prefix: "/admin/comments", key: "comments" },
    { prefix: "/admin/messages", key: "messages" },
    { prefix: "/admin/guest-applications", key: "guest-applications" },
    { prefix: "/admin/members", key: "members" },
    { prefix: "/admin/subscribers", key: "subscribers" },
    { prefix: "/admin/whatsapp", key: "whatsapp" },
    { prefix: "/admin/photos", key: "photos" },
    { prefix: "/admin/bug-reports", key: "bug-reports" },
  ];

  const hrefToSectionKey: Record<string, string> = Object.fromEntries(
    sectionRoutes.map(s => [s.prefix, s.key])
  );

  const getSectionKeyForLocation = (loc: string): string | undefined => {
    const match = sectionRoutes.find(s => loc === s.prefix || loc.startsWith(s.prefix + "/"));
    return match?.key;
  };

  const markSeenMutation = useMutation({
    mutationFn: async (sectionKey: string) => {
      await apiRequest("POST", "/api/admin/notifications/mark-seen", { sectionKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
  });

  const lastMarkedRef = useRef<string>("");
  useEffect(() => {
    const sectionKey = getSectionKeyForLocation(location);
    if (sectionKey && lastMarkedRef.current !== sectionKey) {
      lastMarkedRef.current = sectionKey;
      markSeenMutation.mutate(sectionKey);
    }
  }, [location]);

  const getNotificationCount = (href: string): number => {
    if (!notificationCounts) return 0;
    const key = hrefToSectionKey[href];
    return key ? (notificationCounts[key] || 0) : 0;
  };

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/admin/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/admin/login");
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4 border-b">
            <Link href="/admin" className="flex items-center gap-2">
              <img src={logoUrl} alt="Latest Talks" className="h-8 w-auto" />
            </Link>
          </SidebarHeader>

          <SidebarContent>
            {[
              { label: "Overview", items: overviewItems },
              { label: "Content", items: contentItems },
              { label: "Audience", items: audienceItems },
              { label: "Community", items: communityItems },
              { label: "Business", items: businessItems },
              { label: "Operations", items: operationsItems },
            ].map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const notificationCount = getNotificationCount(item.href);
                      const isActive = location === item.href || 
                        (item.href !== "/admin/operations" && item.href !== "/admin" && location.startsWith(item.href));
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={item.href} className="relative">
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                              {notificationCount > 0 && (
                                <span 
                                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white"
                                  data-testid={`notification-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  {notificationCount > 9 ? "9+" : notificationCount}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/admin/settings"}
                      data-testid="link-admin-settings"
                    >
                      <Link href="/admin/settings">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user.name?.split(" ").map((n) => n[0]).join("") || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="/" target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" size="sm" className="w-full" data-testid="button-view-site">
                  <Home className="h-4 w-4 mr-1" />
                  Site
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex-1"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center gap-4 h-14 px-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="font-semibold">Latest Talks Admin</h1>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
