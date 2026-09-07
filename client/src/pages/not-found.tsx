import { Link } from "wouter";
import { Home, ArrowLeft, Headphones, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import latestTalksLogo from "@assets/Latest Talks Logo png[1]_1764563665460.png";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center py-16">
          <div className="mb-8">
            <img 
              src={latestTalksLogo} 
              alt="Latest Talks" 
              className="h-16 mx-auto mb-6"
            />
            <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/">
              <Button className="gap-2 w-full sm:w-auto" data-testid="button-go-home">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="gap-2 w-full sm:w-auto"
              onClick={() => window.history.back()}
              data-testid="button-go-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
          
          <div className="border-t pt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/podcast">
                <Button variant="ghost" size="sm" className="gap-1">
                  <Headphones className="h-4 w-4" />
                  Browse Podcast
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" size="sm" className="gap-1">
                  <Mail className="h-4 w-4" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
