import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { MemberAuthProvider } from "@/lib/memberAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SynkDexWidget } from "@/components/SynkDexWidget";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import VideoPage from "@/pages/VideoPage";
import PodcastPage from "@/pages/PodcastPage";
import EpisodePage from "@/pages/EpisodePage";
import HostsPage from "@/pages/HostsPage";
import GuestsPage from "@/pages/GuestsPage";
import GuestPage from "@/pages/GuestPage";
import SponsorsPage from "@/pages/SponsorsPage";
import SponsorPage from "@/pages/SponsorPage";
import ContactPage from "@/pages/ContactPage";
import SupportUsPage from "@/pages/SupportUsPage";
import GiftPage from "@/pages/GiftPage";
import AdvertisePage from "@/pages/AdvertisePage";
import OnElAlPage from "@/pages/OnElAlPage";
import LatestTalksPlusPage from "@/pages/LatestTalksPlusPage";
import MemberLoginPage from "@/pages/MemberLoginPage";
import MemberAccountPage from "@/pages/MemberAccountPage";
import MemberSuccessPage from "@/pages/MemberSuccessPage";
import PlusWelcomePage from "@/pages/PlusWelcomePage";
import CommunityPage from "@/pages/CommunityPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminEpisodes from "@/pages/admin/AdminEpisodes";
import AdminSponsors from "@/pages/admin/AdminSponsors";
import AdminGuests from "@/pages/admin/AdminGuests";
import AdminSubscribers from "@/pages/admin/AdminSubscribers";
import AdminComments from "@/pages/admin/AdminComments";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminMembers from "@/pages/admin/AdminMembers";
import AdminPhotos from "@/pages/admin/AdminPhotos";
import AdminMarketing from "@/pages/admin/AdminMarketing";
import AdminSettings from "@/pages/admin/AdminSettings";
import OperationsDashboard from "@/pages/admin/operations/OperationsDashboard";
import TeamPage from "@/pages/admin/operations/TeamPage";
import PipelinePage from "@/pages/admin/operations/PipelinePage";
import DealsPage from "@/pages/admin/operations/DealsPage";
import ProjectsPage from "@/pages/admin/operations/ProjectsPage";
import ExpensesPage from "@/pages/admin/operations/ExpensesPage";
import FinancesPage from "@/pages/admin/operations/FinancesPage";
import EpisodesOperationsPage from "@/pages/admin/operations/EpisodesPage";
import AdSlotRequestsPage from "@/pages/admin/AdSlotRequestsPage";
import AdminWhatsApp from "@/pages/admin/AdminWhatsApp";
import AdminBugReports from "@/pages/admin/AdminBugReports";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import GuestApplicationPage from "@/pages/GuestApplicationPage";
import AdminGuestApplications from "@/pages/admin/AdminGuestApplications";
import AdminMediaLibrary from "@/pages/admin/AdminMediaLibrary";
import AdminPlatforms from "@/pages/admin/AdminPlatforms";
import AdminPlatformDetail from "@/pages/admin/AdminPlatformDetail";
import PlatformLoginPage from "@/pages/PlatformLoginPage";
import PlatformPasswordChange from "@/pages/PlatformPasswordChange";
import PlatformPortal from "@/pages/PlatformPortal";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import CookiePolicyPage from "@/pages/CookiePolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/podcast" component={PodcastPage} />
        <Route path="/video" component={VideoPage} />
        <Route path="/episode/:id" component={EpisodePage} />
        <Route path="/hosts" component={HostsPage} />
        <Route path="/guests" component={GuestsPage} />
        <Route path="/guest/:id" component={GuestPage} />
        <Route path="/sponsors" component={SponsorsPage} />
        <Route path="/sponsor/:id" component={SponsorPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/apply" component={GuestApplicationPage} />
        <Route path="/sponsor" component={SupportUsPage} />
        <Route path="/gift" component={GiftPage} />
        <Route path="/ads" component={AdvertisePage} />
        <Route path="/in-flight" component={OnElAlPage} />
        <Route path="/on-el-al" component={OnElAlPage} />
        <Route path="/plus" component={LatestTalksPlusPage} />
        <Route path="/plus/login" component={MemberLoginPage} />
        <Route path="/plus/account" component={MemberAccountPage} />
        <Route path="/plus/success" component={MemberSuccessPage} />
        <Route path="/plus/welcome" component={PlusWelcomePage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/cookie-policy" component={CookiePolicyPage} />
        <Route path="/terms-of-service" component={TermsOfServicePage} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/analytics" component={AnalyticsPage} />
        <Route path="/admin/episodes" component={AdminEpisodes} />
        <Route path="/admin/sponsors" component={AdminSponsors} />
        <Route path="/admin/guests" component={AdminGuests} />
        <Route path="/admin/subscribers" component={AdminSubscribers} />
        <Route path="/admin/comments" component={AdminComments} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/members" component={AdminMembers} />
        <Route path="/admin/photos" component={AdminPhotos} />
        <Route path="/admin/marketing" component={AdminMarketing} />
        <Route path="/admin/ad-requests" component={AdSlotRequestsPage} />
        <Route path="/admin/whatsapp" component={AdminWhatsApp} />
        <Route path="/admin/bug-reports" component={AdminBugReports} />
        <Route path="/admin/guest-applications" component={AdminGuestApplications} />
        <Route path="/admin/media" component={AdminMediaLibrary} />
        <Route path="/admin/platforms" component={AdminPlatforms} />
        <Route path="/admin/platforms/:id" component={AdminPlatformDetail} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/operations" component={OperationsDashboard} />
        <Route path="/admin/operations/episodes" component={EpisodesOperationsPage} />
        <Route path="/admin/operations/team" component={TeamPage} />
        <Route path="/admin/operations/pipeline" component={PipelinePage} />
        <Route path="/admin/operations/deals" component={DealsPage} />
        <Route path="/admin/operations/projects" component={ProjectsPage} />
        <Route path="/admin/operations/expenses" component={ExpensesPage} />
        <Route path="/admin/operations/finances" component={FinancesPage} />
        <Route path="/platform/login" component={PlatformLoginPage} />
        <Route path="/platform/change-password" component={PlatformPasswordChange} />
        <Route path="/platform/portal" component={PlatformPortal} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <MemberAuthProvider>
              <SynkDexWidget />
              <Toaster />
              <Router />
            </MemberAuthProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
