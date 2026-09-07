import { useQuery } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import { SiInstagram, SiLinkedin, SiTelegram, SiYoutube, SiX } from "react-icons/si";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RichTextContent from "@/components/RichTextContent";
import type { Host } from "@shared/schema";
import hostsTeamImage from "@assets/image_1764481983233.png";

const socialIcons: Record<string, typeof SiInstagram> = {
  instagram: SiInstagram,
  linkedin: SiLinkedin,
  telegram: SiTelegram,
  youtube: SiYoutube,
  x: SiX,
  twitter: SiX,
};

export default function HostsPage() {
  const { data: hosts, isLoading } = useQuery<Host[]>({
    queryKey: ["/api/hosts"],
  });

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-4" data-testid="text-page-title">
            Meet the Hosts
          </h1>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            The voices behind Latest Talks - bringing you top-quality Yiddish entertainment 
            through engaging conversations with fascinating guests.
          </p>

          <div className="mb-12">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img 
                src={hostsTeamImage} 
                alt="The Latest Talks Team" 
                className="w-full h-auto object-cover"
                data-testid="img-hosts-team"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-3">
              The Latest Talks Team
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Skeleton className="w-24 h-24 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-32 mb-4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {hosts?.map((host) => (
                <Card key={host.id} data-testid={`card-host-${host.id}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={host.imageUrl || undefined} alt={host.name} />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                          {host.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-1" data-testid={`text-host-name-${host.id}`}>
                          {host.name}
                        </h2>
                        {host.title && (
                          <p className="text-primary font-medium mb-3">{host.title}</p>
                        )}
                        {host.bio && (
                          <RichTextContent
                            html={host.bio}
                            className="text-muted-foreground mb-4"
                            data-testid={`text-host-bio-${host.id}`}
                          />
                        )}
                        <div className="flex flex-wrap items-center gap-4">
                          {host.email && (
                            <a 
                              href={`mailto:${host.email}`} 
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                              data-testid={`link-host-email-${host.id}`}
                            >
                              <Mail className="h-4 w-4" />
                              {host.email}
                            </a>
                          )}
                          {host.phone && (
                            <a 
                              href={`tel:${host.phone}`} 
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                              data-testid={`link-host-phone-${host.id}`}
                            >
                              <Phone className="h-4 w-4" />
                              {host.phone}
                            </a>
                          )}
                          {host.socialLinks && host.socialLinks.length > 0 && (
                            <div className="flex items-center gap-2">
                              {host.socialLinks.map((social) => {
                                const Icon = socialIcons[social.platform.toLowerCase()] || SiInstagram;
                                return (
                                  <a
                                    key={social.platform}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                    data-testid={`link-host-social-${host.id}-${social.platform}`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
