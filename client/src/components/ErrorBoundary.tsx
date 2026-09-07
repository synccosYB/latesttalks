import { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "wouter";
import { Home, RefreshCw, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import latestTalksLogo from "@assets/Latest Talks Logo png[1]_1764563665460.png";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <header className="fixed top-0 left-0 right-0 z-50 bg-[#10213A] border-b border-border/40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2">
                <img 
                  src={latestTalksLogo} 
                  alt="Latest Talks" 
                  className="h-10"
                />
              </a>
            </div>
          </header>
          
          <main className="flex-1 flex items-center justify-center px-4 pt-16">
            <div className="max-w-lg w-full text-center py-16">
              <div className="mb-8">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Something Went Wrong</h1>
                <p className="text-muted-foreground">
                  We're sorry, but something unexpected happened. Please try refreshing the page or go back to the homepage.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button 
                  onClick={this.handleRefresh}
                  className="gap-2 w-full sm:w-auto"
                  data-testid="button-refresh-page"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="gap-2 w-full sm:w-auto"
                  data-testid="button-go-home"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
              
              <div className="border-t pt-8">
                <p className="text-sm text-muted-foreground mb-4">
                  If this problem persists, please contact us.
                </p>
                <a href="/contact">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Mail className="h-4 w-4" />
                    Contact Support
                  </Button>
                </a>
              </div>
            </div>
          </main>
          
          <footer className="border-t py-6 bg-[#10213A] text-white">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Latest Talks. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}
