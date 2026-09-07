import { useState } from "react";
import { useLocation } from "wouter";
import { useMemberAuth } from "@/lib/memberAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Mail, Lock, User, Phone, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

export default function MemberLoginPage() {
  const [, setLocation] = useLocation();
  const { login, signup, member } = useMemberAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" },
  });

  if (member) {
    setLocation("/plus");
    return null;
  }

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
      setLocation("/plus");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);
    setDuplicateError(null);
    try {
      await signup(data.name, data.email, data.password, data.phone);
      toast({ title: "Account created!", description: "Welcome to Latest Talks+!" });
      setLocation("/plus");
    } catch (error: any) {
      let errorMsg = error.message || "Could not create account";
      let isDuplicate = false;
      try {
        const jsonStart = errorMsg.indexOf("{");
        if (jsonStart !== -1) {
          const parsed = JSON.parse(errorMsg.substring(jsonStart));
          errorMsg = parsed.error || errorMsg;
          isDuplicate = parsed.code === "DUPLICATE_MEMBER";
        }
      } catch {}
      if (isDuplicate) {
        setDuplicateError(errorMsg);
      } else {
        toast({
          title: "Signup failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EDEB] pt-16">
      <Header />
      
      <main className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#DE2026] rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#10213A]" data-testid="text-title">Latest Talks+</h1>
            <p className="text-gray-600 mt-2">Sign in or create an account to access premium content</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" data-testid="tab-signup">Create Account</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 mt-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} type="email" placeholder="you@example.com" className="pl-10" data-testid="input-login-email" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} type={showSigninPassword ? "text" : "password"} placeholder="Enter your password" className="pl-10 pr-10" data-testid="input-login-password" />
                                <button
                                  type="button"
                                  onClick={() => setShowSigninPassword((v) => !v)}
                                  aria-label={showSigninPassword ? "Hide password" : "Show password"}
                                  data-testid="button-toggle-signin-password"
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                >
                                  {showSigninPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isLoading} className="w-full bg-[#DE2026] hover:bg-[#c41c22]" data-testid="button-login">
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="signup">
                  {duplicateError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md" data-testid="alert-duplicate-member">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Account Already Exists</p>
                          <p className="text-sm text-red-700 mt-1">{duplicateError}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 border-red-300 text-red-700"
                            onClick={() => {
                              setDuplicateError(null);
                              const loginTab = document.querySelector('[data-testid="tab-login"]') as HTMLElement;
                              loginTab?.click();
                            }}
                            data-testid="button-go-to-login"
                          >
                            Go to Sign In
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4 mt-4">
                      <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} placeholder="Your full name" className="pl-10" data-testid="input-signup-name" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} type="email" placeholder="you@example.com" className="pl-10" data-testid="input-signup-email" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} type="tel" placeholder="+1 (555) 000-0000" className="pl-10" data-testid="input-signup-phone" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} type={showSignupPassword ? "text" : "password"} placeholder="Create a password" className="pl-10 pr-10" data-testid="input-signup-password" />
                                <button
                                  type="button"
                                  onClick={() => setShowSignupPassword((v) => !v)}
                                  aria-label={showSignupPassword ? "Hide password" : "Show password"}
                                  data-testid="button-toggle-signup-password"
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                >
                                  {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" className="pl-10 pr-10" data-testid="input-signup-confirm" />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword((v) => !v)}
                                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                  data-testid="button-toggle-confirm-password"
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isLoading} className="w-full bg-[#DE2026] hover:bg-[#c41c22]" data-testid="button-signup">
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
