import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, Phone, MapPin, Send, User, Briefcase, Calendar, MessageSquare, Link as LinkIcon, Save, RotateCcw } from "lucide-react";
import { SiInstagram, SiLinkedin, SiYoutube } from "react-icons/si";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type FormData = {
  role: string;
  customRole: string;
  fullName: string;
  preferredCommunication: string;
  phone: string;
  cellPhone: string;
  workPhone: string;
  email: string;
  workEmail: string;
  address: string;
  availability: string;
  introduction: string;
  previousAppearances: string;
  topicsOrQuestions: string;
  linkedinUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
  heardAboutUs: string;
  agreeToTerms: boolean;
};

const initialFormData: FormData = {
  role: "",
  customRole: "",
  fullName: "",
  preferredCommunication: "email",
  phone: "",
  cellPhone: "",
  workPhone: "",
  email: "",
  workEmail: "",
  address: "",
  availability: "",
  introduction: "",
  previousAppearances: "",
  topicsOrQuestions: "",
  linkedinUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  websiteUrl: "",
  heardAboutUs: "",
  agreeToTerms: false,
};

const STORAGE_KEY = "latesttalks_guest_application";

export default function GuestApplicationPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        setHasSavedData(true);
      } catch (e) {
        console.error("Failed to parse saved form data");
      }
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setHasSavedData(true);
    toast({
      title: "Progress Saved",
      description: "Your application has been saved. You can continue later.",
    });
  };

  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(initialFormData);
    setHasSavedData(false);
    toast({
      title: "Form Cleared",
      description: "Your saved progress has been cleared.",
    });
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/guest-applications", formData);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "We've received your application. Check your email for confirmation.",
      });
      localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      toast({
        title: "Please accept terms",
        description: "You must agree to be contacted by our team.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Header />
        <main className="py-8 sm:py-10">
          <div className="max-w-2xl mx-auto px-4">
            <Card className="text-center">
              <CardContent className="p-8 sm:p-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-4" data-testid="text-success-title">Application Submitted!</h1>
                <p className="text-muted-foreground mb-6">
                  Thank you for your interest in appearing on Latest Talks! We've sent a confirmation email to your address.
                  Our team reviews applications weekly and will reach out if you're selected.
                </p>
                <Button onClick={() => setSubmitted(false)} data-testid="button-submit-another">
                  Submit Another Application
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-page-title">
              Be a Guest on Latest Talks
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Join the biggest Jewish podcast in Yiddish! Share your story, expertise, or unique perspective with our engaged audience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Info Sidebar - Sticky on desktop */}
            <div className="lg:col-span-4 space-y-4">
              <div className="lg:sticky lg:top-24">
                <Card className="bg-background">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Studio Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Latest Talks Studio<br />
                      Brooklyn, NY
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Questions?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a 
                      href="mailto:hello@latesttalks.com" 
                      className="text-primary hover:underline font-medium"
                      data-testid="link-email-contact"
                    >
                      hello@latesttalks.com
                    </a>
                  </CardContent>
                </Card>

                <Card className="bg-background mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">What to Expect</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground space-y-2">
                    <p>1. Submit your application</p>
                    <p>2. Receive confirmation email</p>
                    <p>3. Team reviews your profile</p>
                    <p>4. If selected, get scheduled</p>
                    <p>5. Receive calendar invite</p>
                    <p>6. Recording day reminders</p>
                  </CardContent>
                </Card>

                {hasSavedData && (
                  <Card className="bg-green-50 border-green-200 mt-4">
                    <CardContent className="p-4">
                      <p className="text-sm text-green-800 font-medium mb-2">
                        You have a saved application
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSavedData}
                        className="w-full"
                        data-testid="button-clear-saved"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Start Fresh
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Application Form */}
            <div className="lg:col-span-8">
              <Card className="bg-background">
                <CardHeader>
                  <CardTitle className="text-xl">Guest Application Form</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll be in touch if you're a good fit for the show.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Role Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">What's your role in the company? *</Label>
                      <p className="text-sm text-muted-foreground">Select the role that best describes your position</p>
                      <Select 
                        value={formData.role} 
                        onValueChange={(value) => updateField("role", value)}
                        required
                      >
                        <SelectTrigger data-testid="select-role" className="bg-white dark:bg-zinc-900">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ceo-founder">CEO / Founder</SelectItem>
                          <SelectItem value="coo-operations">COO / Operations Director</SelectItem>
                          <SelectItem value="cfo-finance">CFO / Finance Director</SelectItem>
                          <SelectItem value="cmo-marketing">CMO / Marketing Director</SelectItem>
                          <SelectItem value="president">President</SelectItem>
                          <SelectItem value="vp-executive">VP / Executive</SelectItem>
                          <SelectItem value="director-manager">Director / Manager</SelectItem>
                          <SelectItem value="business-owner">Business Owner / Entrepreneur</SelectItem>
                          <SelectItem value="professional">Professional / Expert</SelectItem>
                          <SelectItem value="author">Author / Writer</SelectItem>
                          <SelectItem value="rabbi">Rabbi / Educator</SelectItem>
                          <SelectItem value="community-leader">Community Leader</SelectItem>
                          <SelectItem value="entertainer">Entertainer / Musician</SelectItem>
                          <SelectItem value="public-figure">Public Figure</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="consultant">Consultant / Advisor</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.role === "other" && (
                        <div className="space-y-2 mt-3">
                          <Label htmlFor="customRole">Please specify your role *</Label>
                          <Input
                            id="customRole"
                            value={formData.customRole}
                            onChange={(e) => updateField("customRole", e.target.value)}
                            placeholder="Enter your role"
                            required
                            className="bg-white dark:bg-zinc-900"
                            data-testid="input-custom-role"
                          />
                        </div>
                      )}
                    </div>

                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => updateField("fullName", e.target.value)}
                            placeholder="Your full name"
                            required
                            className="bg-white dark:bg-zinc-900"
                            data-testid="input-fullname"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => updateField("address", e.target.value)}
                            placeholder="Street, City, State, ZIP"
                            className="bg-white dark:bg-zinc-900"
                            data-testid="input-address"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            placeholder="your@email.com"
                            required
                            className="bg-white dark:bg-zinc-900"
                            data-testid="input-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="workEmail">Work Email</Label>
                          <Input
                            id="workEmail"
                            type="email"
                            value={formData.workEmail}
                            onChange={(e) => updateField("workEmail", e.target.value)}
                            placeholder="work@company.com"
                            className="bg-white dark:bg-zinc-900"
                            data-testid="input-work-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="phone-input-wrapper" data-testid="input-phone">
                            <PhoneInput
                              international
                              defaultCountry="US"
                              value={formData.phone}
                              onChange={(value) => updateField("phone", value || "")}
                              className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cellPhone">Cell Phone</Label>
                          <div className="phone-input-wrapper" data-testid="input-cell-phone">
                            <PhoneInput
                              international
                              defaultCountry="US"
                              value={formData.cellPhone}
                              onChange={(value) => updateField("cellPhone", value || "")}
                              className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="workPhone">Work Phone</Label>
                          <div className="phone-input-wrapper" data-testid="input-work-phone">
                            <PhoneInput
                              international
                              defaultCountry="US"
                              value={formData.workPhone}
                              onChange={(value) => updateField("workPhone", value || "")}
                              className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Preferred Contact Method</Label>
                          <RadioGroup 
                            value={formData.preferredCommunication} 
                            onValueChange={(value) => updateField("preferredCommunication", value)}
                            className="flex flex-wrap gap-4 pt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="email" id="pref-email" data-testid="radio-pref-email" />
                              <Label htmlFor="pref-email" className="font-normal">Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="phone" id="pref-phone" data-testid="radio-pref-phone" />
                              <Label htmlFor="pref-phone" className="font-normal">Phone</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="whatsapp" id="pref-whatsapp" data-testid="radio-pref-whatsapp" />
                              <Label htmlFor="pref-whatsapp" className="font-normal">WhatsApp</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                        Social Media & Website
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                            <SiLinkedin className="h-4 w-4" /> LinkedIn URL
                          </Label>
                          <Input
                            id="linkedinUrl"
                            type="url"
                            value={formData.linkedinUrl}
                            onChange={(e) => updateField("linkedinUrl", e.target.value)}
                            placeholder="https://linkedin.com/in/..."
                            className="bg-white dark:bg-zinc-900"
                            data-testid="input-linkedin"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                            <SiInstagram className="h-4 w-4" /> Instagram URL
                          </Label>
                          <Input
                            id="instagramUrl"
                            type="url"
                            value={formData.instagramUrl}
                            onChange={(e) => updateField("instagramUrl", e.target.value)}
                            placeholder="https://instagram.com/..."
                            className="bg-white dark:bg-zinc-900"
                            data-testid="input-instagram"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtubeUrl" className="flex items-center gap-2">
                            <SiYoutube className="h-4 w-4" /> YouTube URL
                          </Label>
                          <Input
                            id="youtubeUrl"
                            type="url"
                            value={formData.youtubeUrl}
                            onChange={(e) => updateField("youtubeUrl", e.target.value)}
                            placeholder="https://youtube.com/..."
                            className="bg-white dark:bg-zinc-900"
                            data-testid="input-youtube"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="websiteUrl">Website URL</Label>
                          <Input
                            id="websiteUrl"
                            type="url"
                            value={formData.websiteUrl}
                            onChange={(e) => updateField("websiteUrl", e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="bg-white dark:bg-zinc-900"
                            data-testid="input-website"
                          />
                        </div>
                      </div>
                    </div>

                    {/* About You */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        Tell Us About Yourself
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="introduction">Brief Introduction *</Label>
                          <Textarea
                            id="introduction"
                            value={formData.introduction}
                            onChange={(e) => updateField("introduction", e.target.value)}
                            placeholder="Tell us about yourself, your background, and what makes your story interesting..."
                            className="min-h-28 resize-none bg-white dark:bg-zinc-900"
                            required
                            data-testid="input-introduction"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="previousAppearances">Previous Podcast/Media Appearances</Label>
                          <Textarea
                            id="previousAppearances"
                            value={formData.previousAppearances}
                            onChange={(e) => updateField("previousAppearances", e.target.value)}
                            placeholder="List any previous podcasts, interviews, or media appearances..."
                            className="min-h-20 resize-none bg-white dark:bg-zinc-900"
                            data-testid="input-previous-appearances"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="topicsOrQuestions">Topics You'd Like to Discuss</Label>
                          <Textarea
                            id="topicsOrQuestions"
                            value={formData.topicsOrQuestions}
                            onChange={(e) => updateField("topicsOrQuestions", e.target.value)}
                            placeholder="What topics, stories, or questions would you like to explore on the show?"
                            className="min-h-20 resize-none bg-white dark:bg-zinc-900"
                            data-testid="input-topics"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        Availability
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="availability">When are you generally available for recording?</Label>
                        <Textarea
                          id="availability"
                          value={formData.availability}
                          onChange={(e) => updateField("availability", e.target.value)}
                          placeholder="e.g., Weekday mornings, Sunday afternoons, flexible schedule..."
                          className="min-h-16 resize-none bg-white dark:bg-zinc-900"
                          data-testid="input-availability"
                        />
                      </div>
                    </div>

                    {/* How Did You Hear About Us */}
                    <div className="space-y-3">
                      <Label htmlFor="heardAboutUs" className="text-base">How did you hear about Latest Talks?</Label>
                      <Select 
                        value={formData.heardAboutUs} 
                        onValueChange={(value) => updateField("heardAboutUs", value)}
                      >
                        <SelectTrigger data-testid="select-heard-about" className="bg-white dark:bg-zinc-900">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="friend">Friend / Family</SelectItem>
                          <SelectItem value="airline">Airline Entertainment</SelectItem>
                          <SelectItem value="event">Event / Conference</SelectItem>
                          <SelectItem value="search">Google / Search</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Terms Agreement */}
                    <div className="bg-secondary/30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onCheckedChange={(checked) => updateField("agreeToTerms", checked as boolean)}
                          data-testid="checkbox-terms"
                        />
                        <Label htmlFor="agreeToTerms" className="text-sm font-normal leading-relaxed">
                          I agree to be contacted by the Latest Talks team regarding my application. 
                          I understand that submitting this form does not guarantee an appearance on the show.
                        </Label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={saveProgress}
                        className="sm:flex-1"
                        data-testid="button-save-continue"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save & Continue Later
                      </Button>
                      <Button 
                        type="submit" 
                        className="sm:flex-1"
                        disabled={submitMutation.isPending || !formData.agreeToTerms}
                        data-testid="button-submit"
                      >
                        {submitMutation.isPending ? "Submitting..." : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
