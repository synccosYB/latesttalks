import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  UsersRound,
  UserPlus,
  Handshake,
  FolderKanban,
  Receipt,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import type { TeamMember, GuestPipeline, Project, Expense, SponsorDeal, MonthlyFinancial } from "@shared/schema";

export default function OperationsDashboard() {
  const { data: teamMembers, isLoading: loadingTeam } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: pipeline, isLoading: loadingPipeline } = useQuery<GuestPipeline[]>({
    queryKey: ["/api/guest-pipeline"],
  });

  const { data: deals, isLoading: loadingDeals } = useQuery<SponsorDeal[]>({
    queryKey: ["/api/sponsor-deals"],
  });

  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: expenses, isLoading: loadingExpenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: financials, isLoading: loadingFinancials } = useQuery<MonthlyFinancial[]>({
    queryKey: ["/api/monthly-financials"],
  });

  const activeTeam = teamMembers?.filter(m => m.status === "active").length || 0;
  const pipelineCount = pipeline?.length || 0;
  const pendingPipeline = pipeline?.filter(p => p.status === "prospect" || p.status === "contacted").length || 0;
  const activeProjects = projects?.filter(p => p.status === "active").length || 0;
  const activeDeals = deals?.filter(d => d.status === "active").length || 0;
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const thisMonthFinancials = financials?.find(f => f.year === currentYear && f.month === currentMonth);
  
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
  const totalDealValue = deals?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;

  const stats = [
    {
      title: "Active Team",
      value: activeTeam,
      subtitle: `${teamMembers?.length || 0} total members`,
      icon: UsersRound,
      loading: loadingTeam,
      href: "/admin/operations/team",
      color: "text-blue-500",
    },
    {
      title: "Guest Pipeline",
      value: pipelineCount,
      subtitle: `${pendingPipeline} pending`,
      icon: UserPlus,
      loading: loadingPipeline,
      href: "/admin/operations/pipeline",
      color: "text-green-500",
    },
    {
      title: "Sponsor Deals",
      value: activeDeals,
      subtitle: `$${totalDealValue.toLocaleString()} total`,
      icon: Handshake,
      loading: loadingDeals,
      href: "/admin/operations/deals",
      color: "text-purple-500",
    },
    {
      title: "Active Projects",
      value: activeProjects,
      subtitle: `${projects?.length || 0} total projects`,
      icon: FolderKanban,
      loading: loadingProjects,
      href: "/admin/operations/projects",
      color: "text-orange-500",
    },
    {
      title: "Monthly Expenses",
      value: `$${totalExpenses.toLocaleString()}`,
      subtitle: "All expenses",
      icon: Receipt,
      loading: loadingExpenses,
      href: "/admin/operations/expenses",
      color: "text-red-500",
    },
  ];

  const recentPipeline = pipeline?.slice(0, 5) || [];
  const recentDeals = deals?.slice(0, 5) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "completed": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "paid": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-operations-title">Operations Dashboard</h1>
          <p className="text-muted-foreground">Manage podcast operations, team, and finances</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" data-testid={`link-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  {stat.loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Guest Pipeline
              </CardTitle>
              <Link href="/admin/operations/pipeline">
                <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-view-all-pipeline">
                  View All
                </span>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingPipeline ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentPipeline.length > 0 ? (
                <div className="space-y-3">
                  {recentPipeline.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`card-pipeline-${item.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.topic || "No topic set"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(item.priority || "medium")} variant="secondary">
                          {item.priority || "medium"}
                        </Badge>
                        <Badge className={getStatusColor(item.status)} variant="secondary">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No guests in pipeline</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Recent Deals
              </CardTitle>
              <Link href="/admin/operations/deals">
                <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-view-all-deals">
                  View All
                </span>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingDeals ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentDeals.length > 0 ? (
                <div className="space-y-3">
                  {recentDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`card-deal-${deal.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">{deal.dealName}</p>
                        <p className="text-xs text-muted-foreground">{deal.dealType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">${Number(deal.amount || 0).toLocaleString()}</span>
                        <Badge className={getStatusColor(deal.status)} variant="secondary">
                          {deal.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No deals yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {thisMonthFinancials && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                This Month's Financial Summary
              </CardTitle>
              <Link href="/admin/operations/finances">
                <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-view-finances">
                  View Details
                </span>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${Number(thisMonthFinancials.totalRevenue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    ${Number(thisMonthFinancials.totalExpenses || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${Number(thisMonthFinancials.netProfit || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-sm text-muted-foreground">Ad Income</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ${Number(thisMonthFinancials.adIncome || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
