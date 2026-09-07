import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Image, Plus, Send, User, Calendar, Plane, MapPin, Heart } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Discussion, DiscussionReply, CommunityPhoto } from "@shared/schema";
import { format } from "date-fns";
import elAlLogo from "@assets/image_1764475161415.png";
import unitedLogo from "@assets/image_1764955422755.png";

const CATEGORIES = [
  { value: "general", label: "General Discussion" },
  { value: "torah", label: "Torah & Inspiration" },
  { value: "podcast", label: "Podcast Feedback" },
  { value: "lifestyle", label: "Lifestyle & Tips" },
];

const AIRLINES: Record<string, string> = {
  "elal": "El Al",
  "el-al": "El Al",
  "united": "United Airlines",
  "delta": "Delta Air Lines",
  "american": "American Airlines",
  "lufthansa": "Lufthansa",
  "british": "British Airways",
  "emirates": "Emirates",
  "turkish": "Turkish Airlines",
  "swiss": "Swiss International",
  "austrian": "Austrian Airlines",
  "jetblue": "JetBlue",
  "southwest": "Southwest Airlines",
  "alaska": "Alaska Airlines",
  "other": "Other Airline",
};

const AIRLINE_LOGOS: Record<string, string> = {
  elal: elAlLogo,
  "el-al": elAlLogo,
  united: unitedLogo,
};

const AIRLINE_COLORS: Record<string, { bg: string; text: string }> = {
  delta: { bg: "#C01933", text: "white" },
  american: { bg: "#0078D2", text: "white" },
  lufthansa: { bg: "#05164D", text: "#FFD700" },
  british: { bg: "#075AAA", text: "white" },
  emirates: { bg: "#D71920", text: "white" },
  turkish: { bg: "#C70A0C", text: "white" },
  swiss: { bg: "#E2001A", text: "white" },
  austrian: { bg: "#E20A17", text: "white" },
  jetblue: { bg: "#003876", text: "white" },
  southwest: { bg: "#304CB2", text: "white" },
  alaska: { bg: "#01426A", text: "white" },
  other: { bg: "#666666", text: "white" },
};

function AirlineLogo({ airline, className = "" }: { airline: string; className?: string }) {
  const logoSrc = AIRLINE_LOGOS[airline];
  
  if (logoSrc) {
    return (
      <div className={`flex items-center ${className}`}>
        <img src={logoSrc} alt={AIRLINES[airline] || airline} className="h-6 w-auto object-contain" />
      </div>
    );
  }

  const colors = AIRLINE_COLORS[airline] || AIRLINE_COLORS.other;
  const label = AIRLINES[airline] || airline;
  
  return (
    <div 
      className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <Plane className="w-3 h-3" />
      {label}
    </div>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("discussions");
  const [showNewDiscussionDialog, setShowNewDiscussionDialog] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [newDiscussion, setNewDiscussion] = useState({
    authorName: "",
    authorEmail: "",
    title: "",
    content: "",
    category: "general",
  });
  const [newReply, setNewReply] = useState({ authorName: "", content: "" });
  const { toast } = useToast();

  const { data: discussions = [] } = useQuery<Discussion[]>({
    queryKey: ["/api/discussions"],
  });

  const { data: photos = [] } = useQuery<CommunityPhoto[]>({
    queryKey: ["/api/community-photos", "approved"],
    queryFn: async () => {
      const res = await fetch("/api/community-photos?status=approved");
      return res.json();
    },
  });

  const { data: replies = [] } = useQuery<DiscussionReply[]>({
    queryKey: ["/api/discussions", selectedDiscussion?.id, "replies"],
    enabled: !!selectedDiscussion,
    queryFn: async () => {
      if (!selectedDiscussion) return [];
      const res = await fetch(`/api/discussions/${selectedDiscussion.id}/replies`);
      return res.json();
    },
  });

  const createDiscussionMutation = useMutation({
    mutationFn: async (data: typeof newDiscussion) => {
      return apiRequest("POST", "/api/discussions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions"] });
      toast({ 
        title: "Discussion submitted!", 
        description: "Your discussion will appear after review." 
      });
      setShowNewDiscussionDialog(false);
      setNewDiscussion({
        authorName: "",
        authorEmail: "",
        title: "",
        content: "",
        category: "general",
      });
    },
    onError: () => {
      toast({ title: "Failed to submit discussion", variant: "destructive" });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (data: { authorName: string; content: string }) => {
      return apiRequest("POST", `/api/discussions/${selectedDiscussion?.id}/replies`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions", selectedDiscussion?.id, "replies"] });
      toast({ title: "Reply posted!" });
      setNewReply({ authorName: "", content: "" });
    },
    onError: () => {
      toast({ title: "Failed to post reply", variant: "destructive" });
    },
  });

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getAirlineLabel = (airline?: string | null) => {
    if (!airline) return "Unknown Airline";
    return AIRLINES[airline] || airline;
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-page-title">
            Latest Talks Community
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join the conversation! Share your thoughts, connect with fellow listeners, 
            and see photos from our amazing community enjoying Latest Talks around the world.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="discussions" data-testid="tab-discussions">
              <MessageSquare className="h-4 w-4 mr-2" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="photos" data-testid="tab-photos">
              <Image className="h-4 w-4 mr-2" />
              Community Photos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussions">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Community Discussions</h2>
              <Button onClick={() => setShowNewDiscussionDialog(true)} data-testid="button-new-discussion">
                <Plus className="h-4 w-4 mr-2" />
                Start Discussion
              </Button>
            </div>

            {discussions.length > 0 ? (
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <Card 
                    key={discussion.id} 
                    className="cursor-pointer hover-elevate transition-all"
                    onClick={() => setSelectedDiscussion(discussion)}
                    data-testid={`card-discussion-${discussion.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">{discussion.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{discussion.authorName}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>
                              {discussion.createdAt 
                                ? format(new Date(discussion.createdAt), "MMM d, yyyy")
                                : "Recently"}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline">{getCategoryLabel(discussion.category || "general")}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-2">{discussion.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {discussion.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          View Discussion
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium mb-2">No discussions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to start a conversation!
                  </p>
                  <Button onClick={() => setShowNewDiscussionDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="photos">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Community Photos</h2>
              <p className="text-muted-foreground">
                See Latest Talks fans enjoying our content on flights around the world!
              </p>
            </div>

            {photos.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden" data-testid={`card-photo-${photo.id}`}>
                    <div className="aspect-video bg-muted">
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption || "Community photo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {photo.airline && (
                          <AirlineLogo airline={photo.airline} />
                        )}
                        {photo.flightNumber && (
                          <Badge variant="secondary" className="text-xs">
                            {photo.flightNumber}
                          </Badge>
                        )}
                      </div>
                      {photo.route && (
                        <p className="text-sm flex items-center gap-1 text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3" />
                          {photo.route}
                        </p>
                      )}
                      {photo.caption && (
                        <p className="text-sm text-muted-foreground mt-2">{photo.caption}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-3">
                        {photo.submitterName && <span>Shared by {photo.submitterName}</span>}
                        {photo.createdAt && (
                          <span className="ml-2">
                            • {format(new Date(photo.createdAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium mb-2">No photos yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Spotted Latest Talks on your flight? Share your photo on the In-Flight page!
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/in-flight">Submit Your Photo</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <Dialog open={showNewDiscussionDialog} onOpenChange={setShowNewDiscussionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Start a New Discussion</DialogTitle>
            <DialogDescription>
              Share your thoughts with the Latest Talks community
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newDiscussion.authorName || !newDiscussion.title || !newDiscussion.content) {
                toast({ title: "Please fill in all required fields", variant: "destructive" });
                return;
              }
              createDiscussionMutation.mutate(newDiscussion);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authorName">Your Name *</Label>
                <Input
                  id="authorName"
                  value={newDiscussion.authorName}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, authorName: e.target.value })}
                  placeholder="Your name"
                  required
                  data-testid="input-author-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newDiscussion.category}
                  onValueChange={(value) => setNewDiscussion({ ...newDiscussion, category: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={newDiscussion.authorEmail}
                onChange={(e) => setNewDiscussion({ ...newDiscussion, authorEmail: e.target.value })}
                placeholder="your@email.com"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Discussion Title *</Label>
              <Input
                id="title"
                value={newDiscussion.title}
                onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                placeholder="What's on your mind?"
                required
                data-testid="input-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Your Message *</Label>
              <Textarea
                id="content"
                value={newDiscussion.content}
                onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                placeholder="Share your thoughts, questions, or ideas..."
                rows={4}
                required
                data-testid="input-content"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewDiscussionDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createDiscussionMutation.isPending}
                className="flex-1"
                data-testid="button-submit-discussion"
              >
                {createDiscussionMutation.isPending ? "Submitting..." : "Submit Discussion"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedDiscussion} onOpenChange={(open) => !open && setSelectedDiscussion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedDiscussion && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl">{selectedDiscussion.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{selectedDiscussion.authorName}</span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span>
                        {selectedDiscussion.createdAt 
                          ? format(new Date(selectedDiscussion.createdAt), "MMM d, yyyy")
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {getCategoryLabel(selectedDiscussion.category || "general")}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="py-4 border-b">
                <p className="whitespace-pre-wrap">{selectedDiscussion.content}</p>
              </div>

              <div className="space-y-4 mt-4">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Replies ({replies.length})
                </h4>

                {replies.length > 0 ? (
                  <div className="space-y-3">
                    {replies.map((reply) => (
                      <div key={reply.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-3 w-3" />
                          <span className="font-medium text-foreground">{reply.authorName}</span>
                          <span>•</span>
                          <span>
                            {reply.createdAt 
                              ? format(new Date(reply.createdAt), "MMM d, yyyy")
                              : "Recently"}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No replies yet. Be the first to respond!</p>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newReply.authorName || !newReply.content) {
                      toast({ title: "Please fill in all fields", variant: "destructive" });
                      return;
                    }
                    createReplyMutation.mutate(newReply);
                  }}
                  className="space-y-3 pt-4 border-t"
                >
                  <div className="space-y-2">
                    <Label htmlFor="replyName">Your Name</Label>
                    <Input
                      id="replyName"
                      value={newReply.authorName}
                      onChange={(e) => setNewReply({ ...newReply, authorName: e.target.value })}
                      placeholder="Your name"
                      data-testid="input-reply-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="replyContent">Your Reply</Label>
                    <Textarea
                      id="replyContent"
                      value={newReply.content}
                      onChange={(e) => setNewReply({ ...newReply, content: e.target.value })}
                      placeholder="Write your reply..."
                      rows={3}
                      data-testid="input-reply-content"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={createReplyMutation.isPending}
                    data-testid="button-submit-reply"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                  </Button>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
