import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Monitor, Eye, EyeOff } from "lucide-react";
import logoUrl from "@assets/logo.jpg";

export default function PlatformLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/platform-auth/login", { email, password });
      const data = await res.json();
      if (data.mustChangePassword) {
        setLocation("/platform/change-password");
      } else {
        setLocation("/platform/portal");
      }
    } catch (err: any) {
      const message = err?.message || "Login failed";
      let errorText = "Invalid email or password";
      try {
        const jsonStr = message.substring(message.indexOf("{"));
        const parsed = JSON.parse(jsonStr);
        errorText = parsed.error || errorText;
      } catch {}
      toast({ title: "Login Failed", description: errorText, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img src={logoUrl} alt="Latest Talks" className="h-12 rounded-md" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Monitor className="w-5 h-5" />
            Platform Portal
          </CardTitle>
          <CardDescription>
            Sign in to submit your podcast KPI data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                data-testid="input-login-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  data-testid="input-login-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#DE2026]"
              disabled={isLoading}
              data-testid="button-login-submit"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Need help? Contact <a href="mailto:Hello@LatestTalks.com" className="text-primary hover:underline" data-testid="link-support-email">Hello@LatestTalks.com</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
