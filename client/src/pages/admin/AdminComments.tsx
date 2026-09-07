import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Trash2, MessageSquare, Clock, CheckCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Comment, Episode } from "@shared/schema";
import { format } from "date-fns";

export default function AdminComments() {
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  const { data: episodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: allComments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/episodes/comments/all"],
    queryFn: async () => {
      if (!episodes) return [];
      const allComments: Comment[] = [];
      for (const episode of episodes) {
        const res = await fetch(`/api/episodes/${episode.id}/comments`);
        if (res.ok) {
          const comments = await res.json();
          allComments.push(...comments);
        }
      }
      return allComments;
    },
    enabled: !!episodes,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/comments/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes/comments/all"] });
      toast({ title: "Comment updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update comment", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes/comments/all"] });
      toast({ title: "Comment deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    },
  });

  const pendingComments = allComments?.filter((c) => c.status === "pending") || [];
  const approvedComments = allComments?.filter((c) => c.status === "approved") || [];
  const rejectedComments = allComments?.filter((c) => c.status === "rejected") || [];

  const getEpisodeTitle = (episodeId: string) => {
    const episode = episodes?.find((e) => e.id === episodeId);
    return episode ? `#${episode.episodeNumber}` : "Unknown";
  };

  const CommentCard = ({ comment }: { comment: Comment }) => (
    <Card className="mb-4" data-testid={`card-comment-${comment.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{comment.authorName}</span>
              <Badge variant="outline" className="text-xs">
                Episode {getEpisodeTitle(comment.episodeId)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, yyyy") : ""}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{comment.content}</p>
            {comment.authorEmail && (
              <p className="text-xs text-muted-foreground mt-2">{comment.authorEmail}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {comment.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => updateMutation.mutate({ id: comment.id, status: "approved" })}
                  data-testid={`button-approve-${comment.id}`}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => updateMutation.mutate({ id: comment.id, status: "rejected" })}
                  data-testid={`button-reject-${comment.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm("Are you sure you want to delete this comment?")) {
                  deleteMutation.mutate(comment.id);
                }
              }}
              data-testid={`button-delete-${comment.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Comments</h1>
          <p className="text-muted-foreground">Moderate episode comments</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingComments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedComments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedComments.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingComments.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedComments.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedComments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : pendingComments.length > 0 ? (
              pendingComments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No pending comments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            {approvedComments.length > 0 ? (
              approvedComments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No approved comments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            {rejectedComments.length > 0 ? (
              rejectedComments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No rejected comments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
