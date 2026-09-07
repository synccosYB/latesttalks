import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bug, Loader2, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BugReportDialogProps {
  trigger?: React.ReactNode;
}

export default function BugReportDialog({ trigger }: BugReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bug-reports", data);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        resetForm();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to submit report", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("general");
    setReporterName("");
    setReporterEmail("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ 
        title: "Required fields missing", 
        description: "Please fill in the title and description", 
        variant: "destructive" 
      });
      return;
    }

    submitMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
      reporterName: reporterName.trim() || null,
      reporterEmail: reporterEmail.trim() || null,
      browser: navigator.userAgent,
      device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop",
      pageUrl: window.location.href,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="button-report-bug">
            <Bug className="h-4 w-4 mr-1" />
            Report a Bug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            Report a Bug
          </DialogTitle>
        </DialogHeader>
        
        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Thank You!</h3>
            <p className="text-muted-foreground text-sm">
              Your bug report has been submitted. We'll look into it soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bug-title">What's the issue? *</Label>
              <Input
                id="bug-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the problem"
                required
                data-testid="input-bug-title"
              />
            </div>

            <div>
              <Label htmlFor="bug-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="bug-category" data-testid="select-bug-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Issue</SelectItem>
                  <SelectItem value="playback">Video/Audio Playback</SelectItem>
                  <SelectItem value="navigation">Navigation Problem</SelectItem>
                  <SelectItem value="account">Account Issues</SelectItem>
                  <SelectItem value="payment">Payment/Subscription</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bug-description">Describe the problem *</Label>
              <Textarea
                id="bug-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? What did you expect to happen?"
                rows={4}
                required
                data-testid="textarea-bug-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bug-name">Your Name (optional)</Label>
                <Input
                  id="bug-name"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="John Doe"
                  data-testid="input-bug-name"
                />
              </div>
              <div>
                <Label htmlFor="bug-email">Email (optional)</Label>
                <Input
                  id="bug-email"
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="you@example.com"
                  data-testid="input-bug-email"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Providing your email allows us to follow up on your report.
            </p>

            <Button 
              type="submit" 
              className="w-full btn-gradient"
              disabled={submitMutation.isPending}
              data-testid="button-submit-bug"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bug className="h-4 w-4 mr-2" />
              )}
              Submit Report
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
