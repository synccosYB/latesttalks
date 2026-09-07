import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { 
  Clock, User, Share2, MessageCircle, 
  Facebook, Twitter, Mail, Link as LinkIcon, Copy, Crown, Lock, Play, Radio
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMemberAuth } from "@/lib/memberAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EpisodeCard from "@/components/EpisodeCard";
import ProtectedVideo from "@/components/ProtectedVideo";
import RichTextContent from "@/components/RichTextContent";
import type { Episode, EpisodeWithGuests, EpisodeSponsor, Sponsor, Comment, Guest } from "@shared/schema";
import ltPlusLogo from "@assets/LT+_Logo_1765168703665.png";

export default function EpisodePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { member } = useMemberAuth();
  const [commentName, setCommentName] = useState("");
  const [commentContent, setCommentContent] = useState("");
  
  const isPremiumMember = member?.subscriptionStatus === "active";
  
  // Premium content access logic:
  // - If isPremiumReleased=true, everyone can watch (released to public)
  // - If isPremiumReleased=false, only premium members can watch

  const { data: episode, isLoading } = useQuery<EpisodeWithGuests>({
    queryKey: [`/api/episodes/${id}`],
    enabled: !!id,
  });

  const { data: sponsors } = useQuery<(EpisodeSponsor & { sponsor: Sponsor })[]>({
    queryKey: [`/api/episodes/${id}/sponsors`],
    enabled: !!id,
  });

  const { data: comments } = useQuery<Comment[]>({
    queryKey: [`/api/episodes/${id}/comments`],
    enabled: !!id,
  });

  const { data: allEpisodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes?status=published"],
  });

  const { data: guest } = useQuery<Guest>({
    queryKey: [`/api/guests/${episode?.guestId}`],
    enabled: !!episode?.guestId,
  });

  const { data: guest2 } = useQuery<Guest>({
    queryKey: [`/api/guests/${episode?.guest2Id}`],
    enabled: !!episode?.guest2Id,
  });

  const { data: guest3 } = useQuery<Guest>({
    queryKey: [`/api/guests/${episode?.guest3Id}`],
    enabled: !!episode?.guest3Id,
  });

  const relatedEpisodes = allEpisodes?.filter(ep => ep.id !== id).slice(0, 3) || [];

  // Scroll to top when episode changes (e.g., clicking related episode)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Track view on page load
  useEffect(() => {
    if (id) {
      apiRequest("POST", `/api/episodes/${id}/view`, { country: "Unknown" }).catch(() => {});
    }
  }, [id]);

  const commentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/episodes/${id}/comments`, {
        authorName: commentName,
        content: commentContent,
      });
    },
    onSuccess: () => {
      toast({ title: "Comment submitted", description: "Your comment is pending approval." });
      setCommentName("");
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/episodes/${id}/comments`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit comment", variant: "destructive" });
    },
  });

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = (platform: string) => {
    const title = episode?.title || "Latest Talks Episode";
    let url = "";
    
    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!" });
        return;
    }
    
    if (url) window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Skeleton className="aspect-video rounded-lg mb-6" />
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <main className="py-16 text-center">
          <h1 className="text-2xl font-bold">Episode not found</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Meta info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>Latest Talks</span>
            <span>·</span>
            {episode.publishedAt && (
              <>
                <span>{new Date(episode.publishedAt).toLocaleDateString()}</span>
                <span>·</span>
              </>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {episode.viewCount?.toLocaleString() || 0} views
            </span>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <h1 className="text-3xl font-bold" data-testid="text-episode-title">
              {episode.title}
            </h1>
            {episode.isPremium && (
              <Badge className="bg-[#10213A] text-white px-2 py-1">
                <img src={ltPlusLogo} alt="LT+" className="h-4 object-contain" />
              </Badge>
            )}
          </div>

          {/* Video Embed or Premium Gating */}
          {/* Premium content handling:
              - Unreleased premium (!isPremiumReleased) + not member: Show donation gate
              - Released premium (isPremiumReleased) with driveLink: Show direct video
              - Released premium without driveLink: Direct to YouTube membership
              - Non-premium or premium member: Show YouTube embed
          */}
          {episode.isPremium && !episode.isPremiumReleased && !isPremiumMember ? (
            // Unreleased premium - show donation gate
            <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-secondary relative">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(https://img.youtube.com/vi/${episode.youtubeId}/hqdefault.jpg)` }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="bg-background/95 rounded-lg p-8 max-w-md shadow-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Exclusive Content</h2>
                  <p className="text-muted-foreground mb-6">
                    This exclusive episode is available only to Latest Talks+ members. 
                    Support the channel with a donation to unlock this and all other exclusive content.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a href="https://www.youtube.com/watch?v=zC5jOZudR5o" target="_blank" rel="noopener noreferrer" data-testid="link-premium-message">
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        <Play className="h-4 w-4 mr-2" />
                        Watch a Message From Us
                      </Button>
                    </a>
                    <Link href="/plus" data-testid="link-donate">
                      <Button variant="outline" className="w-full">
                        <Crown className="h-4 w-4 mr-2" />
                        Sponsor Now - $9.99/month
                      </Button>
                    </Link>
                    {!member && (
                      <Link href="/plus/login" data-testid="link-member-login">
                        <Button variant="outline" className="w-full">
                          Already a member? Sign in
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : episode.isPremium && episode.isPremiumReleased && !episode.driveLink ? (
            // Released premium but no driveLink - direct to YouTube membership
            <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-secondary relative">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(https://img.youtube.com/vi/${episode.youtubeId}/hqdefault.jpg)` }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="bg-background/95 rounded-lg p-8 max-w-md shadow-lg">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Released for Members</h2>
                  <p className="text-muted-foreground mb-6">
                    This content has been released for Latest Talks+ members. Watch it on YouTube with your membership.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a 
                      href={episode.youtubeUrl || `https://www.youtube.com/watch?v=${episode.youtubeId}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      data-testid="link-watch-youtube"
                    >
                      <Button className="w-full bg-[#DE2026] hover:bg-[#c41c22]">
                        <Play className="h-4 w-4 mr-2" />
                        Watch on YouTube
                      </Button>
                    </a>
                    <Link href="/plus" data-testid="link-become-member">
                      <Button variant="outline" className="w-full">
                        <Crown className="h-4 w-4 mr-2" />
                        Not a member yet? Sponsor to join
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : episode.isPremium && episode.isPremiumReleased && (episode.videoFileUrl || episode.driveLink) ? (
            // Released premium with uploaded video or driveLink - show direct video
            <div className="mb-6">
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                {episode.videoFileUrl ? (
                  <video
                    src={episode.videoFileUrl}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    title={episode.title}
                  />
                ) : (
                  <iframe
                    src={episode.driveLink!.replace('/view', '/preview')}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={episode.title}
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <Crown className="h-4 w-4 text-green-600" />
                This premium content has been released for all members to enjoy!
              </p>
            </div>
          ) : (
            // Non-premium content or premium member viewing unreleased content
            <div className="mb-6">
              <ProtectedVideo 
                youtubeId={episode.youtubeId} 
                title={episode.title}
                isPremium={episode.isPremium ?? false}
              />
            </div>
          )}

          {/* Share Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Share:
            </span>
            <Button size="icon" variant="outline" onClick={() => handleShare("whatsapp")} data-testid="button-share-whatsapp">
              <SiWhatsapp className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => handleShare("facebook")} data-testid="button-share-facebook">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => handleShare("twitter")} data-testid="button-share-twitter">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => handleShare("email")} data-testid="button-share-email">
              <Mail className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => handleShare("copy")} data-testid="button-share-copy">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="my-6" />

          {/* Description */}
          <div className="prose prose-sm max-w-none mb-6">
            <RichTextContent
              html={episode.description || ""}
              data-testid="text-episode-description"
            />
          </div>

          {/* Guest Info */}
          {(episode.guest || guest || episode.guest2 || guest2 || episode.guest3 || guest3) && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {[episode.guest, episode.guest2, episode.guest3].filter(Boolean).length > 1 
                    ? "Featured Guests" 
                    : "Featured Guest"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {/* Guest 1 */}
                {(episode.guest || guest) && (
                  episode.guestId && guest ? (
                    <Link href={`/guest/${guest.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        {guest.imageUrl ? (
                          <img 
                            src={guest.imageUrl} 
                            alt={guest.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-lg group-hover:text-primary transition-colors" data-testid="text-guest-name">
                            {guest.name}
                          </p>
                          {guest.title && (
                            <p className="text-sm text-muted-foreground">{guest.title}</p>
                          )}
                          {guest.company && (
                            <p className="text-xs text-muted-foreground">{guest.company}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors">
                          View Profile →
                        </Badge>
                      </div>
                    </Link>
                  ) : episode.guest ? (
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium" data-testid="text-guest-name">{episode.guest.name}</p>
                        {episode.guest.website && (
                          <p className="text-sm text-muted-foreground">{episode.guest.website}</p>
                        )}
                      </div>
                    </div>
                  ) : null
                )}
                
                {/* Guest 2 */}
                {(episode.guest2 || guest2) && (
                  episode.guest2Id && guest2 ? (
                    <Link href={`/guest/${guest2.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        {guest2.imageUrl ? (
                          <img 
                            src={guest2.imageUrl} 
                            alt={guest2.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-lg group-hover:text-primary transition-colors" data-testid="text-guest-2-name">
                            {guest2.name}
                          </p>
                          {guest2.title && (
                            <p className="text-sm text-muted-foreground">{guest2.title}</p>
                          )}
                          {guest2.company && (
                            <p className="text-xs text-muted-foreground">{guest2.company}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors">
                          View Profile →
                        </Badge>
                      </div>
                    </Link>
                  ) : episode.guest2 ? (
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium" data-testid="text-guest-2-name">{episode.guest2.name}</p>
                      </div>
                    </div>
                  ) : null
                )}
                
                {/* Guest 3 */}
                {(episode.guest3 || guest3) && (
                  episode.guest3Id && guest3 ? (
                    <Link href={`/guest/${guest3.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        {guest3.imageUrl ? (
                          <img 
                            src={guest3.imageUrl} 
                            alt={guest3.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-lg group-hover:text-primary transition-colors" data-testid="text-guest-3-name">
                            {guest3.name}
                          </p>
                          {guest3.title && (
                            <p className="text-sm text-muted-foreground">{guest3.title}</p>
                          )}
                          {guest3.company && (
                            <p className="text-xs text-muted-foreground">{guest3.company}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors">
                          View Profile →
                        </Badge>
                      </div>
                    </Link>
                  ) : episode.guest3 ? (
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium" data-testid="text-guest-3-name">{episode.guest3.name}</p>
                      </div>
                    </div>
                  ) : null
                )}
              </CardContent>
            </Card>
          )}

          {/* Sponsors */}
          {sponsors && sponsors.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-amber-600">★</span>
                  This Episode Sponsored By
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-3">
                  {sponsors.map((es) => (
                    <Link key={es.id} href={`/sponsor/${es.sponsor.id}`}>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-background border hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group">
                        {es.sponsor.logoUrl ? (
                          <img src={es.sponsor.logoUrl} alt={es.sponsor.name} className="h-6 w-6 object-contain" />
                        ) : (
                          <div className="h-6 w-6 rounded bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                            {es.sponsor.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-sm group-hover:text-amber-700 transition-colors">
                          {es.sponsor.name}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          {episode.timestamps && episode.timestamps.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Timestamps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {episode.timestamps.map((ts, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-primary">{ts.time}</span>
                      <span>{ts.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Hashtags */}
          {episode.hashtags && episode.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {episode.hashtags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-primary">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-8" />

          {/* Comments Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments
            </h3>
            <Card className="mb-4">
              <CardContent className="p-4">
                <Input
                  placeholder="Your name"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="mb-3"
                  data-testid="input-comment-name"
                />
                <Textarea
                  placeholder="Share your thoughts..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="mb-3 resize-none min-h-24"
                  data-testid="input-comment-content"
                />
                <Button 
                  onClick={() => commentMutation.mutate()}
                  disabled={!commentName || !commentContent || commentMutation.isPending}
                  data-testid="button-submit-comment"
                >
                  {commentMutation.isPending ? "Submitting..." : "Post Comment"}
                </Button>
              </CardContent>
            </Card>
            
            {comments && comments.length > 0 && (
              <div className="space-y-4">
                {comments.filter(c => c.status === "approved").map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <p className="font-medium mb-1">{comment.authorName}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {comment.createdAt && new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                      <p>{comment.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Related Episodes */}
          {relatedEpisodes.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Related Episodes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedEpisodes.map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
