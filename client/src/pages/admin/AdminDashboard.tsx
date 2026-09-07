import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Users, DollarSign, Mail, MessageSquare, UserCheck, Eye, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import type { Episode, Sponsor, Guest, Subscriber, ContactMessage, Comment } from "@shared/schema";

export default function AdminDashboard() {
  const { data: episodes, isLoading: loadingEpisodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: sponsors, isLoading: loadingSponsors } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const { data: guests, isLoading: loadingGuests } = useQuery<Guest[]>({
    queryKey: ["/api/guests"],
  });

  const { data: subscribers, isLoading: loadingSubscribers } = useQuery<Subscriber[]>({
    queryKey: ["/api/subscribers"],
  });

  const totalViews = episodes?.reduce((sum, ep) => sum + (ep.viewCount || 0), 0) || 0;
  const publishedEpisodes = episodes?.filter(e => e.status === "published").length || 0;

  const stats = [
    {
      title: "Total Episodes",
      value: episodes?.length || 0,
      subtitle: `${publishedEpisodes} published`,
      icon: Video,
      loading: loadingEpisodes,
      href: "/admin/episodes",
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      subtitle: "Across all episodes",
      icon: Eye,
      loading: loadingEpisodes,
      href: "/admin/episodes",
    },
    {
      title: "Active Sponsors",
      value: sponsors?.length || 0,
      subtitle: "Supporting the show",
      icon: DollarSign,
      loading: loadingSponsors,
      href: "/admin/sponsors",
    },
    {
      title: "Featured Guests",
      value: guests?.length || 0,
      subtitle: "Guest profiles",
      icon: Users,
      loading: loadingGuests,
      href: "/admin/guests",
    },
    {
      title: "Subscribers",
      value: subscribers?.length || 0,
      subtitle: "Newsletter signups",
      icon: UserCheck,
      loading: loadingSubscribers,
      href: "/admin/subscribers",
    },
  ];

  const recentEpisodes = episodes?.slice(0, 5) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the Latest Talks admin portal</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" data-testid={`link-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
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
                <TrendingUp className="h-5 w-5" />
                Recent Episodes
              </CardTitle>
              <Link href="/admin/episodes">
                <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-view-all-episodes">
                  View All →
                </span>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingEpisodes ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentEpisodes.length > 0 ? (
                <div className="space-y-3">
                  {recentEpisodes.map((episode) => (
                    <Link key={episode.id} href="/admin/episodes">
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer transition-all hover:bg-muted"
                        data-testid={`card-recent-episode-${episode.id}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-sm">
                            #{episode.episodeNumber} - {episode.title.slice(0, 40)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {episode.status} • {(episode.viewCount || 0).toLocaleString()} views
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No episodes yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Active Sponsors
              </CardTitle>
              <Link href="/admin/sponsors">
                <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-view-all-sponsors">
                  View All →
                </span>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingSponsors ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : sponsors && sponsors.length > 0 ? (
                <div className="space-y-3">
                  {sponsors.slice(0, 5).map((sponsor) => (
                    <Link key={sponsor.id} href="/admin/sponsors">
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer transition-all hover:bg-muted"
                        data-testid={`card-sponsor-${sponsor.id}`}
                      >
                        <div>
                          <p className="font-medium text-sm">{sponsor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sponsor.contractStatus || "Active"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No sponsors yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
