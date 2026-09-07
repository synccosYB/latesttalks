import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Video, 
  Crown, 
  MessageSquare, 
  Camera,
  Mail,
  DollarSign,
  Play,
  Headphones,
  Calendar,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import type { Episode, Subscriber, Member, CommunityPhoto, Discussion, Comment, SponsorEmailEvent, Sponsor } from "@shared/schema";

type EpisodeWithLabel = Episode & { computedLabel?: string | null; recentViews?: number };

const COLORS = ['#10213A', '#DE2026', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function AnalyticsPage() {
  const { data: episodes, isLoading: episodesLoading } = useQuery<EpisodeWithLabel[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: subscribers, isLoading: subscribersLoading } = useQuery<Subscriber[]>({
    queryKey: ["/api/subscribers"],
  });

  const { data: members, isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: photos, isLoading: photosLoading } = useQuery<CommunityPhoto[]>({
    queryKey: ["/api/community-photos"],
  });

  const { data: discussions, isLoading: discussionsLoading } = useQuery<Discussion[]>({
    queryKey: ["/api/discussions"],
  });

  const { data: sponsorEmailEvents } = useQuery<SponsorEmailEvent[]>({
    queryKey: ["/api/sponsor-email-events"],
  });

  const { data: sponsors } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const isLoading = episodesLoading || subscribersLoading || membersLoading || photosLoading || discussionsLoading;

  const totalViews = episodes?.reduce((sum, ep) => sum + (ep.viewCount || 0), 0) || 0;
  const publishedEpisodes = episodes?.filter(ep => ep.status === "published") || [];
  const videoEpisodes = publishedEpisodes.filter(ep => ep.type === "video");
  const audioEpisodes = publishedEpisodes.filter(ep => ep.type === "audio");
  const activeMembers = members?.filter(m => m.subscriptionStatus === "active") || [];
  const approvedPhotos = photos?.filter(p => p.status === "approved") || [];
  const approvedDiscussions = discussions?.filter(d => d.status === "approved") || [];

  const topEpisodes = [...(publishedEpisodes || [])]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 10)
    .map(ep => ({
      name: `#${ep.episodeNumber}`,
      title: ep.title?.substring(0, 30) + (ep.title && ep.title.length > 30 ? "..." : ""),
      views: ep.viewCount || 0,
    }));

  const categoryData = publishedEpisodes.reduce((acc, ep) => {
    const category = ep.category || "general";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const viewsByCategory = publishedEpisodes.reduce((acc, ep) => {
    const category = ep.category || "general";
    acc[category] = (acc[category] || 0) + (ep.viewCount || 0);
    return acc;
  }, {} as Record<string, number>);

  const viewsByCategoryData = Object.entries(viewsByCategory)
    .map(([name, views]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      views,
    }))
    .sort((a, b) => b.views - a.views);

  const monthlyMemberData = (() => {
    const months: Record<string, number> = {};
    members?.forEach(m => {
      if (m.createdAt) {
        const date = new Date(m.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months[key] = (months[key] || 0) + 1;
      }
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => {
        const [year, m] = month.split('-');
        const date = new Date(parseInt(year), parseInt(m) - 1);
        return {
          name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          members: count,
        };
      });
  })();

  const monthlySubscriberData = (() => {
    const months: Record<string, number> = {};
    subscribers?.forEach(s => {
      if (s.createdAt) {
        const date = new Date(s.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months[key] = (months[key] || 0) + 1;
      }
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => {
        const [year, m] = month.split('-');
        const date = new Date(parseInt(year), parseInt(m) - 1);
        return {
          name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          subscribers: count,
        };
      });
  })();

  const membershipRevenue = (() => {
    const monthlyMembers = activeMembers.filter(m => m.planType === "monthly").length;
    const yearlyMembers = activeMembers.filter(m => m.planType === "yearly").length;
    const monthlyRevenue = monthlyMembers * 9.99;
    const yearlyRevenue = yearlyMembers * (120 / 12);
    return {
      monthlyMembers,
      yearlyMembers,
      totalMRR: monthlyRevenue + yearlyRevenue,
      totalARR: (monthlyRevenue + yearlyRevenue) * 12,
    };
  })();

  const emailEngagement = (() => {
    const events = sponsorEmailEvents || [];
    const sent = events.filter(e => e.eventType === 'sent' || e.eventType === 'opened').length;
    const opened = events.filter(e => e.eventType === 'opened').length;
    const openRate = sent > 0 ? (opened / sent * 100).toFixed(1) : '0.0';
    const bySponsor = events.reduce((acc, e) => {
      const sponsorId = e.sponsorId || 'unknown';
      if (!acc[sponsorId]) {
        acc[sponsorId] = { sent: 0, opened: 0 };
      }
      if (e.eventType === 'sent' || e.eventType === 'opened') {
        acc[sponsorId].sent++;
      }
      if (e.eventType === 'opened') {
        acc[sponsorId].opened++;
      }
      return acc;
    }, {} as Record<string, { sent: number; opened: number }>);
    return { sent, opened, openRate, bySponsor };
  })();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your podcast performance</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-analytics-title">Analytics</h1>
        <p className="text-muted-foreground">Track your podcast performance and engagement</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-views">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all episodes</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-episodes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Episodes</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedEpisodes.length}</div>
            <p className="text-xs text-muted-foreground">
              {videoEpisodes.length} video, {audioEpisodes.length} audio
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-subscribers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Newsletter Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Email subscribers</p>
          </CardContent>
        </Card>

        <Card data-testid="card-members">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LT+ Members</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {membershipRevenue.monthlyMembers} monthly, {membershipRevenue.yearlyMembers} yearly
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-mrr">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${membershipRevenue.totalMRR.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Est. ${membershipRevenue.totalARR.toFixed(0)}/year
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-community-photos">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Photos</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedPhotos.length}</div>
            <p className="text-xs text-muted-foreground">Approved submissions</p>
          </CardContent>
        </Card>

        <Card data-testid="card-discussions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discussions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedDiscussions.length}</div>
            <p className="text-xs text-muted-foreground">Active discussions</p>
          </CardContent>
        </Card>

        <Card data-testid="card-sponsor-emails">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sponsor Email Engagement</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailEngagement.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              {emailEngagement.opened} opened / {emailEngagement.sent} sent
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-views">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Views/Episode</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publishedEpisodes.length > 0 
                ? Math.round(totalViews / publishedEpisodes.length).toLocaleString() 
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per published episode</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-top-episodes">
          <CardHeader>
            <CardTitle>Top Episodes by Views</CardTitle>
            <CardDescription>Your most popular episodes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topEpisodes} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={40} />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), "Views"]}
                  labelFormatter={(label) => {
                    const ep = topEpisodes.find(e => e.name === label);
                    return ep?.title || label;
                  }}
                />
                <Bar dataKey="views" fill="#10213A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-category-distribution">
          <CardHeader>
            <CardTitle>Episodes by Category</CardTitle>
            <CardDescription>Content distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={false}
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} episodes`, name]} />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  formatter={(value: string, entry: any) => {
                    const total = categoryChartData.reduce((sum, d) => sum + d.value, 0);
                    const item = categoryChartData.find(d => d.name === value);
                    const percent = item ? ((item.value / total) * 100).toFixed(0) : 0;
                    return `${value} (${percent}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-views-by-category">
          <CardHeader>
            <CardTitle>Views by Category</CardTitle>
            <CardDescription>Total views across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viewsByCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), "Views"]} />
                <Bar dataKey="views" fill="#DE2026" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-growth">
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
            <CardDescription>Member and subscriber growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  allowDuplicatedCategory={false}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {monthlySubscriberData.length > 0 && (
                  <Line 
                    data={monthlySubscriberData}
                    type="monotone" 
                    dataKey="subscribers" 
                    stroke="#10213A" 
                    name="Subscribers"
                    strokeWidth={2}
                  />
                )}
                {monthlyMemberData.length > 0 && (
                  <Line 
                    data={monthlyMemberData}
                    type="monotone" 
                    dataKey="members" 
                    stroke="#DE2026" 
                    name="Members"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-episode-table">
        <CardHeader>
          <CardTitle>Episode Performance</CardTitle>
          <CardDescription>Detailed breakdown of all {publishedEpisodes.length} published episodes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Title</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Category</th>
                  <th className="text-right py-2 px-2">Views</th>
                  <th className="text-left py-2 px-2">Label</th>
                  <th className="text-center py-2 px-2">View</th>
                </tr>
              </thead>
              <tbody>
                {publishedEpisodes
                  .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                  .map(ep => (
                    <tr key={ep.id} className="border-b hover:bg-muted/50" data-testid={`row-episode-${ep.id}`}>
                      <td className="py-2 px-2">{ep.episodeNumber}</td>
                      <td className="py-2 px-2 max-w-xs truncate">
                        <Link href={`/episode/${ep.id}`} className="hover:text-primary hover:underline">
                          {ep.title}
                        </Link>
                      </td>
                      <td className="py-2 px-2">
                        <span className="flex items-center gap-1">
                          {ep.type === "video" ? <Play className="h-3 w-3" /> : <Headphones className="h-3 w-3" />}
                          {ep.type}
                        </span>
                      </td>
                      <td className="py-2 px-2 capitalize">{ep.category}</td>
                      <td className="py-2 px-2 text-right font-medium">{(ep.viewCount || 0).toLocaleString()}</td>
                      <td className="py-2 px-2">
                        {ep.computedLabel && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            ep.computedLabel === "Trending Now" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                            ep.computedLabel === "New Release" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                            ep.computedLabel === "Most Popular" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}>
                            {ep.computedLabel}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Link href={`/episode/${ep.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-view-episode-${ep.id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
