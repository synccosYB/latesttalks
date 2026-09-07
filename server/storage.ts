import { 
  type User, type InsertUser,
  type Episode, type InsertEpisode, type EpisodeWithGuests,
  type Sponsor, type InsertSponsor,
  type EpisodeSponsor, type InsertEpisodeSponsor,
  type Subscriber, type InsertSubscriber,
  type CommunityPhoto, type InsertCommunityPhoto,
  type ViewAnalytic, type InsertViewAnalytic,
  type SponsorMilestone, type InsertSponsorMilestone,
  type SponsorInquiry, type InsertSponsorInquiry,
  type ContactMessage, type InsertContactMessage,
  type Host, type InsertHost,
  type Guest, type InsertGuest,
  type Comment, type InsertComment,
  type Member, type InsertMember,
  type SubscriptionHistory, type InsertSubscriptionHistory,
  type Discussion, type InsertDiscussion,
  type DiscussionReply, type InsertDiscussionReply,
  type EmailNotification, type InsertEmailNotification,
  type SponsorViewMetric, type InsertSponsorViewMetric,
  type MarketingSettings, type InsertMarketingSettings,
  type TeamMember, type InsertTeamMember,
  type GuestPipeline, type InsertGuestPipeline,
  type EpisodeAdSlot, type InsertEpisodeAdSlot,
  type EpisodeCost, type InsertEpisodeCost,
  type EpisodeProduction, type InsertEpisodeProduction,
  type Expense, type InsertExpense,
  type Project, type InsertProject,
  type ProjectSponsor, type InsertProjectSponsor,
  type SponsorDeal, type InsertSponsorDeal,
  type MonthlyFinancial, type InsertMonthlyFinancial,
  type YearlyAdIncome, type InsertYearlyAdIncome,
  type AdSlotRequest, type InsertAdSlotRequest,
  type BugReport, type InsertBugReport,
  type GuestApplication, type InsertGuestApplication,
  type UpcomingEpisodeInfo, type InsertUpcomingEpisodeInfo,
  type SponsorUpdateRecipient, type InsertSponsorUpdateRecipient,
  type SponsorEmailEvent, type InsertSponsorEmailEvent,
  type Platform, type InsertPlatform,
  type PlatformContact, type InsertPlatformContact,
  type PlatformUser, type InsertPlatformUser,
  type PlatformEpisodeLink, type InsertPlatformEpisodeLink,
  type EpisodePlatformKpi, type InsertEpisodePlatformKpi,
  type KpiHistory, type InsertKpiHistory,
  type AdminSectionView, type InsertAdminSectionView,
  type SponsorPromoCode, type InsertSponsorPromoCode,
} from "@shared/schema";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Episodes
  getEpisode(id: string): Promise<Episode | undefined>;
  getEpisodeWithGuests(id: string): Promise<EpisodeWithGuests | undefined>;
  getEpisodes(filters?: { status?: string; category?: string; type?: string }): Promise<Episode[]>;
  getEpisodesWithGuests(filters?: { status?: string; category?: string; type?: string }): Promise<EpisodeWithGuests[]>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: string, episode: Partial<InsertEpisode>): Promise<Episode | undefined>;
  deleteEpisode(id: string): Promise<boolean>;
  incrementEpisodeViews(id: string): Promise<void>;
  setEpisodeViewCount(id: string, viewCount: number): Promise<void>;

  // Sponsors
  getSponsor(id: string): Promise<Sponsor | undefined>;
  getSponsors(): Promise<Sponsor[]>;
  createSponsor(sponsor: InsertSponsor): Promise<Sponsor>;
  updateSponsor(id: string, sponsor: Partial<InsertSponsor>): Promise<Sponsor | undefined>;
  deleteSponsor(id: string): Promise<boolean>;

  // Episode Sponsors
  getEpisodeSponsors(episodeId: string): Promise<(EpisodeSponsor & { sponsor: Sponsor })[]>;
  getSponsorEpisodes(sponsorId: string): Promise<(EpisodeSponsor & { episode: Episode })[]>;
  addEpisodeSponsor(episodeSponsor: InsertEpisodeSponsor): Promise<EpisodeSponsor>;
  removeEpisodeSponsor(id: string): Promise<boolean>;

  // Subscribers
  getSubscriber(id: string): Promise<Subscriber | undefined>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  getSubscribers(): Promise<Subscriber[]>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  updateSubscriber(id: string, subscriber: Partial<InsertSubscriber>): Promise<Subscriber | undefined>;
  deleteSubscriber(id: string): Promise<boolean>;

  // Community Photos
  getCommunityPhoto(id: string): Promise<CommunityPhoto | undefined>;
  getCommunityPhotos(status?: string): Promise<CommunityPhoto[]>;
  createCommunityPhoto(photo: InsertCommunityPhoto): Promise<CommunityPhoto>;
  updateCommunityPhoto(id: string, photo: Partial<InsertCommunityPhoto>): Promise<CommunityPhoto | undefined>;
  deleteCommunityPhoto(id: string): Promise<boolean>;

  // View Analytics
  trackView(analytic: InsertViewAnalytic): Promise<ViewAnalytic>;
  getEpisodeAnalytics(episodeId: string): Promise<{country: string, count: number}[]>;
  getRecentViewsByEpisode(days?: number): Promise<{episodeId: string, recentViews: number}[]>;

  // Sponsor Milestones
  getSponsorMilestones(sponsorId: string): Promise<SponsorMilestone[]>;
  createSponsorMilestone(milestone: InsertSponsorMilestone): Promise<SponsorMilestone>;
  getMilestoneExists(sponsorId: string, episodeId: string, milestone: number): Promise<boolean>;

  // Sponsor Update Recipients
  getSponsorUpdateRecipients(sponsorId: string): Promise<SponsorUpdateRecipient[]>;
  createSponsorUpdateRecipient(recipient: InsertSponsorUpdateRecipient): Promise<SponsorUpdateRecipient>;
  deleteSponsorUpdateRecipient(id: string): Promise<boolean>;

  // Sponsor Email Events
  getSponsorEmailEvents(sponsorId?: string): Promise<SponsorEmailEvent[]>;
  getSponsorEmailEventByToken(token: string): Promise<SponsorEmailEvent | undefined>;
  createSponsorEmailEvent(event: InsertSponsorEmailEvent): Promise<SponsorEmailEvent>;
  updateSponsorEmailEvent(id: string, event: Partial<InsertSponsorEmailEvent>): Promise<SponsorEmailEvent | undefined>;

  // Sponsor Inquiries
  getSponsorInquiry(id: string): Promise<SponsorInquiry | undefined>;
  getSponsorInquiries(): Promise<SponsorInquiry[]>;
  createSponsorInquiry(inquiry: InsertSponsorInquiry): Promise<SponsorInquiry>;
  updateSponsorInquiry(id: string, inquiry: Partial<SponsorInquiry>): Promise<SponsorInquiry | undefined>;

  // Contact Messages
  getContactMessage(id: string): Promise<ContactMessage | undefined>;
  getContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessage(id: string, message: Partial<ContactMessage>): Promise<ContactMessage | undefined>;

  // Hosts
  getHosts(): Promise<Host[]>;
  getHost(id: string): Promise<Host | undefined>;
  createHost(host: InsertHost): Promise<Host>;
  updateHost(id: string, host: Partial<InsertHost>): Promise<Host | undefined>;
  deleteHost(id: string): Promise<boolean>;

  // Guests
  getGuests(): Promise<Guest[]>;
  getGuest(id: string): Promise<Guest | undefined>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(id: string, guest: Partial<InsertGuest>): Promise<Guest | undefined>;
  deleteGuest(id: string): Promise<boolean>;

  // Comments
  getEpisodeComments(episodeId: string, status?: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, comment: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<boolean>;

  // Members (Latest Talks+ subscribers)
  getMember(id: string): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  getMemberByStripeCustomerId(customerId: string): Promise<Member | undefined>;
  getMemberByReplitId(replitId: string): Promise<Member | undefined>;
  findDuplicateMembers(criteria: { email: string; name?: string; phone?: string }): Promise<{ field: string; member: Member } | null>;
  getMembers(): Promise<Member[]>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: Partial<Member>): Promise<Member | undefined>;
  deleteMember(id: string): Promise<boolean>;
  upsertMemberByReplitId(data: { replitId: string; email: string; name: string; profileImageUrl?: string }): Promise<Member>;

  // Subscription History
  getSubscriptionHistory(memberId: string): Promise<SubscriptionHistory[]>;
  createSubscriptionHistory(history: InsertSubscriptionHistory): Promise<SubscriptionHistory>;

  // Premium Episodes
  getPremiumEpisodes(): Promise<Episode[]>;

  // Discussions
  getDiscussions(status?: string): Promise<Discussion[]>;
  getDiscussion(id: string): Promise<Discussion | undefined>;
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  updateDiscussion(id: string, discussion: Partial<Discussion>): Promise<Discussion | undefined>;
  deleteDiscussion(id: string): Promise<boolean>;

  // Discussion Replies
  getDiscussionReplies(discussionId: string): Promise<DiscussionReply[]>;
  createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply>;
  deleteDiscussionReply(id: string): Promise<boolean>;

  // Email Notifications (Marketing)
  getEmailNotifications(filters?: { type?: string; status?: string }): Promise<EmailNotification[]>;
  getEmailNotification(id: string): Promise<EmailNotification | undefined>;
  createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification>;
  updateEmailNotification(id: string, notification: Partial<EmailNotification>): Promise<EmailNotification | undefined>;

  // Sponsor View Metrics
  getSponsorViewMetric(sponsorId: string): Promise<SponsorViewMetric | undefined>;
  getSponsorViewMetrics(): Promise<SponsorViewMetric[]>;
  createOrUpdateSponsorViewMetric(sponsorId: string, views: number): Promise<SponsorViewMetric>;
  updateSponsorMilestone(sponsorId: string, milestone: number): Promise<void>;

  // Marketing Settings
  getMarketingSettings(): Promise<MarketingSettings>;
  updateMarketingSettings(settings: Partial<MarketingSettings>): Promise<MarketingSettings>;

  // Helper: Get active subscribers for email
  getActiveSubscribers(): Promise<Subscriber[]>;

  // ============================================
  // ADMIN PORTAL - OPERATIONS MANAGEMENT
  // ============================================

  // Team Members
  getTeamMembers(status?: string): Promise<TeamMember[]>;
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<boolean>;

  // Guest Pipeline
  getGuestPipeline(filters?: { status?: string; priority?: string }): Promise<GuestPipeline[]>;
  getGuestPipelineItem(id: string): Promise<GuestPipeline | undefined>;
  createGuestPipelineItem(item: InsertGuestPipeline): Promise<GuestPipeline>;
  updateGuestPipelineItem(id: string, item: Partial<InsertGuestPipeline>): Promise<GuestPipeline | undefined>;
  deleteGuestPipelineItem(id: string): Promise<boolean>;

  // Episode Ad Slots
  getEpisodeAdSlots(episodeId: string): Promise<EpisodeAdSlot[]>;
  createEpisodeAdSlot(slot: InsertEpisodeAdSlot): Promise<EpisodeAdSlot>;
  updateEpisodeAdSlot(id: string, slot: Partial<InsertEpisodeAdSlot>): Promise<EpisodeAdSlot | undefined>;
  deleteEpisodeAdSlot(id: string): Promise<boolean>;

  // Episode Costs
  getEpisodeCosts(episodeId: string): Promise<EpisodeCost[]>;
  createEpisodeCost(cost: InsertEpisodeCost): Promise<EpisodeCost>;
  updateEpisodeCost(id: string, cost: Partial<InsertEpisodeCost>): Promise<EpisodeCost | undefined>;
  deleteEpisodeCost(id: string): Promise<boolean>;

  // Episode Production
  getEpisodeProduction(episodeId: string): Promise<EpisodeProduction | undefined>;
  createEpisodeProduction(production: InsertEpisodeProduction): Promise<EpisodeProduction>;
  updateEpisodeProduction(id: string, production: Partial<InsertEpisodeProduction>): Promise<EpisodeProduction | undefined>;
  getAllEpisodeProductions(filters?: { status?: string }): Promise<EpisodeProduction[]>;

  // Expenses
  getExpenses(filters?: { category?: string; projectId?: string; episodeId?: string }): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Projects
  getProjects(status?: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Project Sponsors
  getProjectSponsors(projectId: string): Promise<ProjectSponsor[]>;
  createProjectSponsor(sponsor: InsertProjectSponsor): Promise<ProjectSponsor>;
  updateProjectSponsor(id: string, sponsor: Partial<InsertProjectSponsor>): Promise<ProjectSponsor | undefined>;
  deleteProjectSponsor(id: string): Promise<boolean>;

  // Sponsor Deals
  getSponsorDeals(sponsorId?: string): Promise<SponsorDeal[]>;
  getSponsorDeal(id: string): Promise<SponsorDeal | undefined>;
  createSponsorDeal(deal: InsertSponsorDeal): Promise<SponsorDeal>;
  updateSponsorDeal(id: string, deal: Partial<InsertSponsorDeal>): Promise<SponsorDeal | undefined>;
  deleteSponsorDeal(id: string): Promise<boolean>;

  // Monthly Financials
  getMonthlyFinancials(year?: number): Promise<MonthlyFinancial[]>;
  getMonthlyFinancial(year: number, month: number): Promise<MonthlyFinancial | undefined>;
  createOrUpdateMonthlyFinancial(financial: InsertMonthlyFinancial): Promise<MonthlyFinancial>;

  // Yearly Ad Income
  getYearlyAdIncome(): Promise<YearlyAdIncome[]>;
  createOrUpdateYearlyAdIncome(income: InsertYearlyAdIncome): Promise<YearlyAdIncome>;

  // Ad Slot Requests
  getAdSlotRequest(id: string): Promise<AdSlotRequest | undefined>;
  getAdSlotRequests(status?: string): Promise<AdSlotRequest[]>;
  createAdSlotRequest(request: InsertAdSlotRequest): Promise<AdSlotRequest>;
  updateAdSlotRequest(id: string, request: Partial<AdSlotRequest>): Promise<AdSlotRequest | undefined>;
  deleteAdSlotRequest(id: string): Promise<boolean>;

  // Bug Reports
  getBugReports(filters?: { status?: string; priority?: string }): Promise<BugReport[]>;
  getBugReport(id: string): Promise<BugReport | undefined>;
  createBugReport(report: InsertBugReport): Promise<BugReport>;
  updateBugReport(id: string, report: Partial<BugReport>): Promise<BugReport | undefined>;
  deleteBugReport(id: string): Promise<boolean>;
  markAllBugReportsRead(): Promise<void>;

  // Guest Applications
  getGuestApplications(status?: string): Promise<GuestApplication[]>;
  getGuestApplication(id: string): Promise<GuestApplication | undefined>;
  createGuestApplication(application: InsertGuestApplication): Promise<GuestApplication>;
  updateGuestApplication(id: string, application: Partial<GuestApplication>): Promise<GuestApplication | undefined>;
  deleteGuestApplication(id: string): Promise<boolean>;

  // Upcoming Episode Info
  getUpcomingEpisodeInfo(): Promise<UpcomingEpisodeInfo | undefined>;
  createOrUpdateUpcomingEpisodeInfo(info: InsertUpcomingEpisodeInfo): Promise<UpcomingEpisodeInfo>;

  // Platforms
  getPlatforms(): Promise<Platform[]>;
  getPlatform(id: string): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: string, platform: Partial<InsertPlatform>): Promise<Platform | undefined>;
  deletePlatform(id: string): Promise<boolean>;
  // Platform Contacts
  getPlatformContacts(platformId: string): Promise<PlatformContact[]>;
  createPlatformContact(contact: InsertPlatformContact): Promise<PlatformContact>;
  deletePlatformContact(id: string): Promise<boolean>;
  // Platform Users
  getPlatformUsers(platformId: string): Promise<PlatformUser[]>;
  getPlatformUser(id: string): Promise<PlatformUser | undefined>;
  getPlatformUserByEmail(email: string): Promise<PlatformUser | undefined>;
  createPlatformUser(user: InsertPlatformUser): Promise<PlatformUser>;
  updatePlatformUser(id: string, user: Partial<InsertPlatformUser>): Promise<PlatformUser | undefined>;
  deletePlatformUser(id: string): Promise<boolean>;
  // Platform Episode Links
  getPlatformEpisodeLinks(platformId: string): Promise<PlatformEpisodeLink[]>;
  createPlatformEpisodeLink(link: InsertPlatformEpisodeLink): Promise<PlatformEpisodeLink>;
  deletePlatformEpisodeLink(id: string): Promise<boolean>;
  // Episode Platform KPIs
  getEpisodeKpis(episodeId: string): Promise<EpisodePlatformKpi[]>;
  getEpisodeKpisByPlatform(platformId: string): Promise<EpisodePlatformKpi[]>;
  getKpiByPlatformAndEpisode(platformId: string, episodeId: string): Promise<EpisodePlatformKpi | undefined>;
  upsertEpisodeKpi(kpi: InsertEpisodePlatformKpi): Promise<EpisodePlatformKpi>;
  // KPI History
  getKpiHistory(platformId: string, episodeId?: string): Promise<KpiHistory[]>;
  createKpiHistoryEntry(entry: InsertKpiHistory): Promise<KpiHistory>;
  // Admin Section Views (notification badges)
  getAdminSectionView(adminUserId: string, sectionKey: string): Promise<AdminSectionView | null>;
  upsertAdminSectionView(adminUserId: string, sectionKey: string): Promise<AdminSectionView>;
  getAdminNotificationCounts(adminUserId: string): Promise<Record<string, number>>;
  // Sponsor Promo Codes
  getSponsorPromoCodes(sponsorId: string): Promise<SponsorPromoCode[]>;
  createSponsorPromoCode(promoCode: InsertSponsorPromoCode): Promise<SponsorPromoCode>;
  updateSponsorPromoCode(id: string, promoCode: Partial<InsertSponsorPromoCode>): Promise<SponsorPromoCode | undefined>;
  deleteSponsorPromoCode(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private episodes: Map<string, Episode> = new Map();
  private sponsors: Map<string, Sponsor> = new Map();
  private episodeSponsors: Map<string, EpisodeSponsor> = new Map();
  private subscribers: Map<string, Subscriber> = new Map();
  private communityPhotos: Map<string, CommunityPhoto> = new Map();
  private viewAnalytics: Map<string, ViewAnalytic> = new Map();
  private sponsorMilestones: Map<string, SponsorMilestone> = new Map();
  private sponsorInquiries: Map<string, SponsorInquiry> = new Map();
  private contactMessages: Map<string, ContactMessage> = new Map();
  private hosts: Map<string, Host> = new Map();
  private guests: Map<string, Guest> = new Map();
  private comments: Map<string, Comment> = new Map();
  private members: Map<string, Member> = new Map();
  private subscriptionHistory: Map<string, SubscriptionHistory> = new Map();
  private discussions: Map<string, Discussion> = new Map();
  private discussionReplies: Map<string, DiscussionReply> = new Map();
  private emailNotifications: Map<string, EmailNotification> = new Map();
  private sponsorViewMetrics: Map<string, SponsorViewMetric> = new Map();
  private sponsorUpdateRecipients: Map<string, SponsorUpdateRecipient> = new Map();
  private sponsorEmailEvents: Map<string, SponsorEmailEvent> = new Map();
  private marketingSettings: MarketingSettings | null = null;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed admin user
    const adminId = randomUUID();
    // Use environment variable for admin password, or generate random password if not set
    const adminPassword = process.env.ADMIN_PASSWORD || randomBytes(16).toString("hex");
    const adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`[SECURITY] Generated random admin password. Set ADMIN_PASSWORD env var in production.`);
    }
    this.users.set(adminId, {
      id: adminId,
      email: "admin@latesttalks.com",
      password: adminPasswordHash,
      name: "Pinchus Raab",
      role: "admin",
      status: "active",
      createdAt: new Date(),
    });

    // Seed host
    const hostId = randomUUID();
    this.hosts.set(hostId, {
      id: hostId,
      name: "Pinchus Raab",
      title: "Host & Producer",
      bio: "Creator and host of Latest Talks Podcast. Bringing top-quality Yiddish entertainment through engaging conversations with fascinating guests.",
      imageUrl: null,
      email: "pinchus@latesttalks.com",
      phone: null,
      socialLinks: [
        { platform: "instagram", url: "https://www.instagram.com/latest_talks/" },
        { platform: "linkedin", url: "https://www.linkedin.com/company/latesttalks" },
      ],
      order: 0,
    });

    // Seed sample sponsors
    const sponsorData = [
      { name: "CardRight", website: "https://cardright.com/LT", contactEmail: "info@cardright.com", contactPhone: null },
      { name: "United Refuah", website: "https://unitedrefuah.org", contactEmail: null, contactPhone: null },
      { name: "Luxury Kosher Villas", website: "https://luxurykoshervillas.com", contactEmail: null, contactPhone: "+1305-650-8830" },
      { name: "Appliance Choice", website: null, contactEmail: null, contactPhone: "845-402-1703" },
      { name: "Hiring4Less", website: "https://hiring4less.com", contactEmail: "info@hiring4less.com", contactPhone: "+1845-682-0990" },
      { name: "Jell Tel", website: null, contactEmail: null, contactPhone: "+1212-444-1122" },
    ];

    sponsorData.forEach(s => {
      const id = randomUUID();
      this.sponsors.set(id, {
        id,
        name: s.name,
        logoUrl: null,
        website: s.website,
        contactName: null,
        contactEmail: s.contactEmail,
        contactPhone: s.contactPhone,
        contractAmount: null,
        contractStatus: "active",
        contractEndDate: null,
        notes: null,
        createdAt: new Date(),
      });
    });

    // Seed all 59 real episodes scraped from latesttalks.com
    const allEpisodes: Omit<Episode, "id" | "createdAt">[] = [
      // Episode 60 - Nov 30, 2025
      {
        title: "Latest Talks #60 | The Untold Stories of Lev Leyeled - Full Live Podcast Replay",
        episodeNumber: 60,
        youtubeUrl: "https://www.youtube.com/watch?v=6y2UQ4016H0",
        youtubeId: "6y2UQ4016H0",
        thumbnailUrl: "https://i.ytimg.com/vi/6y2UQ4016H0/hqdefault.jpg",
        description: "Lev Leyeled Live Podcast Replay - https://LevLeyeled.org/LT\n\nHost: Pinchus Raab\nGuest: Gershon Mendel Taub & Pinchus Rosenberg\nPodium Guest: Michy Herzog, Beri Glauber, Mordechai Pinkas\nFilmed: TwoTone Media\nStage: Spark Production\n\nPrime Time Sponsors:\n• United Refuah HealthShare | +1914-908-3300 | UnitedRefuah.org",
        guestName: "Gershon Mendel Taub & Pinchus Rosenberg",
        guestContact: "levleyeled.org",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: "TwoTone Media",
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-11-30"),
        scheduledAt: null,
        transcript: null,
        viewCount: 1418,
        timestamps: null,
        hashtags: ["LevLeyeled", "LatestTalksPodcast"],
        driveLink: "https://LevLeyeled.org/LT",
      },
      // Episode 59 - Nov 24, 2025
      {
        title: "Latest Talks Podcast #59 | How to make money in the long term | Adir Publishing | Mendy Feferkorn",
        episodeNumber: 59,
        youtubeUrl: "https://www.youtube.com/watch?v=GDXQmvrtlpI",
        youtubeId: "GDXQmvrtlpI",
        thumbnailUrl: "https://i.ytimg.com/vi/GDXQmvrtlpI/hqdefault.jpg",
        description: "Guest 1: Mendy Feferkorn - Public Speaker on financial planning\nContact: mendy@feferkorn.com | MendyFeferkorn.com\n\nGuest 2: Chuny Deutsch - Technical Partner\n\nHost: Pinchus Raab\nAnimation: Meilich Melber\n\nPrime Time Sponsors:\n• Levana Teeth Whitening | +1929-269-5771\n• United Refuah HealthShare | +1914-908-3300 | UnitedRefuah.org",
        guestName: "Mendy Feferkorn",
        guestContact: "MendyFeferkorn.com",
        guestEmail: "mendy@feferkorn.com",
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-11-24"),
        scheduledAt: null,
        transcript: null,
        viewCount: 7102,
        timestamps: null,
        hashtags: ["Finance", "MendyFeferkorn", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 58 - Sep 3, 2025
      {
        title: "Latest Talks Podcast #58 | Finding Jobs | Building Businesses | Tech Startups | VCs | AI Shidduchim",
        episodeNumber: 58,
        youtubeUrl: "https://www.youtube.com/watch?v=NeZAKKk977k",
        youtubeId: "NeZAKKk977k",
        thumbnailUrl: "https://i.ytimg.com/vi/NeZAKKk977k/hqdefault.jpg",
        description: "Topics: Finding Jobs | Building Businesses | Tech Startups | VCs | AI Shidduchim.\n\nGuest: Moshe Berish Teitelbaum",
        guestName: "Moshe Berish Teitelbaum",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-09-03"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5430,
        timestamps: null,
        hashtags: ["Tech", "Startups", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 57 - Jul 27, 2025
      {
        title: "Latest Talks Podcast #57 | Upbringing | Parents' Divorce | Yoel's Divorce | Klei Hamikdosh Project",
        episodeNumber: 57,
        youtubeUrl: "https://www.youtube.com/watch?v=Nv-HsApcBms",
        youtubeId: "Nv-HsApcBms",
        thumbnailUrl: "https://i.ytimg.com/vi/Nv-HsApcBms/hqdefault.jpg",
        description: "Topics: Upbringing | Parents' Divorce | Yoel's Divorce | Klei Hamikdosh Project.\n\nGuest: Yoel Gold - @hashkifa",
        guestName: "Yoel Gold",
        guestContact: "@hashkifa",
        guestEmail: "info@hashkifa.com",
        hostName: "Pinchus Raab",
        studioName: "Hashkifa Studios",
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-07-27"),
        scheduledAt: null,
        transcript: null,
        viewCount: 12340,
        timestamps: [
          { time: "00:00", label: "Intro" },
          { time: "01:53", label: "CardRight" },
          { time: "03:32", label: "UnitedRefuah.org" },
          { time: "04:37", label: "Episode Start" },
        ],
        hashtags: ["YoelGold", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 56 - Jul 8, 2025
      {
        title: "Latest Talks Podcast #56 | The Affordable \"Jewish\" Alternative to Health Insurance | United Refuah",
        episodeNumber: 56,
        youtubeUrl: "https://www.youtube.com/watch?v=n4qj73RFf7s",
        youtubeId: "n4qj73RFf7s",
        thumbnailUrl: "https://i.ytimg.com/vi/n4qj73RFf7s/hqdefault.jpg",
        description: "Guest: Moishe Katz - CEO of United Refuah HealthShare\nContact: +1 786-664-7435 | mkatz@unitedrefuah.org",
        guestName: "Moishe Katz",
        guestContact: "UnitedRefuah.org",
        guestEmail: "mkatz@unitedrefuah.org",
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-07-08"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8234,
        timestamps: null,
        hashtags: ["HealthShare", "UnitedRefuah", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 55 - Jun 10, 2025
      {
        title: "Latest Talks Podcast #55 | Bnei Yissaschar's Rare Sefer | Ovadia's Nevios | 15 Days of Darkness | Guest: Jake Turx - P2",
        episodeNumber: 55,
        youtubeUrl: "https://www.youtube.com/watch?v=KbG3qkGQnLU",
        youtubeId: "KbG3qkGQnLU",
        thumbnailUrl: "https://i.ytimg.com/vi/KbG3qkGQnLU/hqdefault.jpg",
        description: "Topics: Bnei Yissaschar's Rare Sefer | Ovadia's Nevios | 15 Days of Darkness.\n\nGuest: Jake Turx - Senior White-House Correspondent (Part 2)",
        guestName: "Jake Turx",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-06-10"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6712,
        timestamps: null,
        hashtags: ["JakeTurx", "Torah", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 54 - Apr 10, 2025
      {
        title: "Latest Talks Podcast #54 | Happiness | Meaning in Life | Lubavitcher Rebbe | Our Nefesh | Guest: Rabbi YY Jacobson",
        episodeNumber: 54,
        youtubeUrl: "https://www.youtube.com/watch?v=hMa-JWWGdf0",
        youtubeId: "hMa-JWWGdf0",
        thumbnailUrl: "https://i.ytimg.com/vi/hMa-JWWGdf0/hqdefault.jpg",
        description: "Topics: Happiness | Meaning in Life | Lubavitcher Rebbe | Our Nefesh.\n\nGuest: Rabbi YY Jacobson",
        guestName: "Rabbi YY Jacobson",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-04-10"),
        scheduledAt: null,
        transcript: null,
        viewCount: 9456,
        timestamps: null,
        hashtags: ["Happiness", "RabbiYYJacobson", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 53 - Mar 11, 2025
      {
        title: "Latest Talks Podcast #53 | Marketing | Comedy Writing | Technology | Picnic | Business | Guest: Pinny Glick",
        episodeNumber: 53,
        youtubeUrl: "https://www.youtube.com/watch?v=PRopTPYNlIU",
        youtubeId: "PRopTPYNlIU",
        thumbnailUrl: "https://i.ytimg.com/vi/PRopTPYNlIU/hqdefault.jpg",
        description: "Topics: Marketing | Comedy Writing | Technology | Picnic | Business.\n\nGuest: Pinny Glick",
        guestName: "Pinny Glick",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-03-11"),
        scheduledAt: null,
        transcript: null,
        viewCount: 7890,
        timestamps: null,
        hashtags: ["Marketing", "Comedy", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 52 - Feb 2, 2025
      {
        title: "Latest Talks Podcast #52 | The Prison System | Yoely's Mission | Insights & Stories | Guest: Yoely Weiser",
        episodeNumber: 52,
        youtubeUrl: "https://www.youtube.com/watch?v=FSuZdse5zGw",
        youtubeId: "FSuZdse5zGw",
        thumbnailUrl: "https://i.ytimg.com/vi/FSuZdse5zGw/hqdefault.jpg",
        description: "Topics: The Prison System | Yoely's Mission | Insights & Stories.\n\nGuest: Yoely Weiser",
        guestName: "Yoely Weiser",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-02-02"),
        scheduledAt: null,
        transcript: null,
        viewCount: 11234,
        timestamps: null,
        hashtags: ["Prison", "Kiruv", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 51 - Jan 6, 2025
      {
        title: "Latest Talks Podcast #51 | Health | Diets | Diabetes | Obesity | Smoking | Exercise | Guest: Yonasan Schwartz & Yitzchok Stralberg",
        episodeNumber: 51,
        youtubeUrl: "https://www.youtube.com/watch?v=Xb5EJNx_B4A",
        youtubeId: "Xb5EJNx_B4A",
        thumbnailUrl: "https://i.ytimg.com/vi/Xb5EJNx_B4A/hqdefault.jpg",
        description: "Topics: Health | Diets | Diabetes | Obesity | Smoking | Exercise.\n\nGuest: Yonasan Schwartz & Yitzchok Stralberg",
        guestName: "Yonasan Schwartz & Yitzchok Stralberg",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2025-01-06"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8567,
        timestamps: null,
        hashtags: ["Health", "Wellness", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 50 - Dec 12, 2024
      {
        title: "Latest Talks Podcast #50 | Life History | Badchen Career | Connection to Viznitz Rebbe | Guest: R' Yankel Miller",
        episodeNumber: 50,
        youtubeUrl: "https://www.youtube.com/watch?v=ehqzK2YWeaY",
        youtubeId: "ehqzK2YWeaY",
        thumbnailUrl: "https://i.ytimg.com/vi/ehqzK2YWeaY/hqdefault.jpg",
        description: "Topics: Life History | Badchen Career | Connection to Viznitz Rebbe.\n\nGuest: R' Yankel Miller",
        guestName: "R' Yankel Miller",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-12-12"),
        scheduledAt: null,
        transcript: null,
        viewCount: 10234,
        timestamps: null,
        hashtags: ["Badchen", "ViznitzRebbe", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 49 - Sep 28, 2024
      {
        title: "Latest Talks Podcast #49 | Uman Rosh Hashanah | Kiruv | Neturei Karta | Loi Niskabel | Guest: R' Mota Frank",
        episodeNumber: 49,
        youtubeUrl: "https://www.youtube.com/watch?v=4D6_6253yuw",
        youtubeId: "4D6_6253yuw",
        thumbnailUrl: "https://i.ytimg.com/vi/4D6_6253yuw/hqdefault.jpg",
        description: "Topics: Uman Rosh Hashanah | Kiruv | Neturei Karta | Loi Niskabel.\n\nGuest: R' Mota Frank",
        guestName: "R' Mota Frank",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-09-28"),
        scheduledAt: null,
        transcript: null,
        viewCount: 14567,
        timestamps: null,
        hashtags: ["Uman", "RoshHashanah", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 48 - Sep 5, 2024
      {
        title: "Latest Talks Podcast #48 | Sound Healing | The Possible You | Self Growth | Energies | Guest: Chaim Hersh Friedman",
        episodeNumber: 48,
        youtubeUrl: "https://www.youtube.com/watch?v=lghiIbndncY",
        youtubeId: "lghiIbndncY",
        thumbnailUrl: "https://i.ytimg.com/vi/lghiIbndncY/hqdefault.jpg",
        description: "Topics: Sound Healing | The Possible You | Self Growth | Energies.\n\nGuest: Chaim Hersh Friedman",
        guestName: "Chaim Hersh Friedman",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-09-05"),
        scheduledAt: null,
        transcript: null,
        viewCount: 9876,
        timestamps: null,
        hashtags: ["SoundHealing", "SelfGrowth", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 47 - Aug 9, 2024
      {
        title: "Latest Talks Podcast #47 | Ger Tzedek | Violins | National Anthems | Mashgiach Kashrus | Guest: R' Avraham Goldstein",
        episodeNumber: 47,
        youtubeUrl: "https://www.youtube.com/watch?v=tXvh41IQ_y0",
        youtubeId: "tXvh41IQ_y0",
        thumbnailUrl: "https://i.ytimg.com/vi/tXvh41IQ_y0/hqdefault.jpg",
        description: "Topics: Ger Tzedek | Violins | National Anthems | Mashgiach Kashrus.\n\nGuest: R' Avraham Goldstein",
        guestName: "R' Avraham Goldstein",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-08-09"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8234,
        timestamps: null,
        hashtags: ["GerTzedek", "Kashrus", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 46 - Jun 28, 2024
      {
        title: "Latest Talks Podcast #46 | Our Economy | Bullying | Mercaz Daf Yomi | People at Risk | Guest: R' Yossi Klein",
        episodeNumber: 46,
        youtubeUrl: "https://www.youtube.com/watch?v=Abbcbi_6dGw",
        youtubeId: "Abbcbi_6dGw",
        thumbnailUrl: "https://i.ytimg.com/vi/Abbcbi_6dGw/hqdefault.jpg",
        description: "Topics: Our Economy | Bullying | Mercaz Daf Yomi | People at Risk.\n\nGuest: R' Yossi Klein",
        guestName: "R' Yossi Klein",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-06-28"),
        scheduledAt: null,
        transcript: null,
        viewCount: 7654,
        timestamps: null,
        hashtags: ["Economy", "DafYomi", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 45 - Jun 9, 2024
      {
        title: "Latest Talks Podcast #45 | Sound Healing | The Future For Music | Music Producing | Guest: Naftali Schnitzler",
        episodeNumber: 45,
        youtubeUrl: "https://www.youtube.com/watch?v=miKVkKNMI-c",
        youtubeId: "miKVkKNMI-c",
        thumbnailUrl: "https://i.ytimg.com/vi/miKVkKNMI-c/hqdefault.jpg",
        description: "Topics: Sound Healing | The Future For Music | Music Producing.\n\nGuest: Naftali Schnitzler",
        guestName: "Naftali Schnitzler",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-06-09"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["Music", "SoundHealing", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 44 - May 2, 2024
      {
        title: "Latest Talks Podcast #44 | Ari's Yetzias Mitzrayim Journey | What A Day Vlogs | Videos | Guest: Ari Chaimowitz",
        episodeNumber: 44,
        youtubeUrl: "https://www.youtube.com/watch?v=b-gAAKrA3Gg",
        youtubeId: "b-gAAKrA3Gg",
        thumbnailUrl: "https://i.ytimg.com/vi/b-gAAKrA3Gg/hqdefault.jpg",
        description: "Topics: Ari's Yetzias Mitzrayim Journey | What A Day Vlogs | Videos.\n\nGuest: Ari Chaimowitz",
        guestName: "Ari Chaimowitz",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-05-02"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5432,
        timestamps: null,
        hashtags: ["Vlogs", "YetziasMitzrayim", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 43 - Apr 4, 2024
      {
        title: "Latest Talks Podcast #43 | Chasidus | Mushrooms | Trees | His School | Lyme Disease | Guest: Rabbi Shloime Ehrlich #2",
        episodeNumber: 43,
        youtubeUrl: "https://www.youtube.com/watch?v=JKKg2-nFcA4",
        youtubeId: "JKKg2-nFcA4",
        thumbnailUrl: "https://i.ytimg.com/vi/JKKg2-nFcA4/hqdefault.jpg",
        description: "Topics: Chasidus | Mushrooms | Trees | His School | Lyme Disease.\n\nGuest: Rabbi Shloime Ehrlich (Second Appearance)",
        guestName: "Rabbi Shloime Ehrlich",
        guestContact: "rabbiehrlich.org",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-04-04"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6789,
        timestamps: null,
        hashtags: ["Chasidus", "RabbiEhrlich", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 42 - Mar 21, 2024
      {
        title: "Latest Talks Podcast #42 | Purim Episode | Comedy | Moishe's Life | Wine | Olive Oil | Guest: Moishe Mayer",
        episodeNumber: 42,
        youtubeUrl: "https://www.youtube.com/watch?v=QKKsCkDSL5U",
        youtubeId: "QKKsCkDSL5U",
        thumbnailUrl: "https://i.ytimg.com/vi/QKKsCkDSL5U/hqdefault.jpg",
        description: "Purim Episode!\n\nTopics: Comedy | Moishe's Life | Wine | Olive Oil.\n\nGuest: Moishe Mayer",
        guestName: "Moishe Mayer",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-03-21"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8765,
        timestamps: null,
        hashtags: ["Purim", "Comedy", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 41 - Feb 7, 2024
      {
        title: "Latest Talks Podcast #41 | Living in Texas | Travel | Peter Santenello Vlogs | Chabad | Guest: Shloime Zionce",
        episodeNumber: 41,
        youtubeUrl: "https://www.youtube.com/watch?v=Ag9Ob-1sn3c",
        youtubeId: "Ag9Ob-1sn3c",
        thumbnailUrl: "https://i.ytimg.com/vi/Ag9Ob-1sn3c/hqdefault.jpg",
        description: "Topics: Living in Texas | Travel | Peter Santenello Vlogs | Chabad.\n\nGuest: Shloime Zionce",
        guestName: "Shloime Zionce",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2024-02-07"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5678,
        timestamps: null,
        hashtags: ["Texas", "Travel", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 40 - Dec 14, 2023
      {
        title: "Latest Talks Podcast #40 | Universal Record Deal | Personal Health | Learning | Fame | Guest: Shulem Lemmer",
        episodeNumber: 40,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Universal Record Deal | Personal Health | Learning | Fame.\n\nGuest: Shulem Lemmer",
        guestName: "Shulem Lemmer",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-12-14"),
        scheduledAt: null,
        transcript: null,
        viewCount: 12345,
        timestamps: null,
        hashtags: ["Music", "ShulemLemmer", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 39 - Nov 27, 2023
      {
        title: "Latest Talks Podcast #39 | Events & Productions | Big Party Coming Up | Hasc In Covid | Guest: Moishe Greenstein",
        episodeNumber: 39,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Events & Productions | Big Party Coming Up | Hasc In Covid.\n\nGuest: Moishe Greenstein",
        guestName: "Moishe Greenstein",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-11-27"),
        scheduledAt: null,
        transcript: null,
        viewCount: 7654,
        timestamps: null,
        hashtags: ["Events", "Productions", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 38 - Oct 11, 2023
      {
        title: "Latest Talks Podcast #38 | Breath Work | Healing | YomTov Lipa Album Review | Guest: Lipa Schmeltzer",
        episodeNumber: 38,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Breath Work | Healing | YomTov Lipa, Album Review.\n\nGuest: Lipa Schmeltzer",
        guestName: "Lipa Schmeltzer",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-10-11"),
        scheduledAt: null,
        transcript: null,
        viewCount: 15678,
        timestamps: null,
        hashtags: ["Lipa", "Music", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 37 - Aug 17, 2023
      {
        title: "Latest Talks Podcast #37 | Rise To Fame | How He's Consistent | Over 20,000 Talmidim | Guest: Reb Eli Stefansky",
        episodeNumber: 37,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Rise To Fame | How He's Consistent | Over 20,000 Talmidim.\n\nGuest: Reb Eli Stefansky - Daf Yomi Maggid Shiur",
        guestName: "Reb Eli Stefansky",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-08-17"),
        scheduledAt: null,
        transcript: null,
        viewCount: 23456,
        timestamps: null,
        hashtags: ["DafYomi", "EliStefansky", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 36 - Aug 2, 2023
      {
        title: "Latest Talks Podcast #36 | Lehasig Courses | Nice Vs. Real | How To Be More Successful | Guest: R' Yeedle Melber",
        episodeNumber: 36,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Lehasig Courses | Nice Vs. Real | How To Be More Successful.\n\nGuest: R' Yeedle Melber",
        guestName: "R' Yeedle Melber",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-08-02"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["Success", "Lehasig", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 35 - Jun 29, 2023
      {
        title: "Latest Talks Podcast #35 | Second Marriage | Divorce | Trade Dress Law | New Album | Guest: Yonasan Schwartz (2.0)",
        episodeNumber: 35,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Second Marriage | Divorce | Trade Dress Law | New Album.\n\nGuest: Yonasan Schwartz (Second Appearance)",
        guestName: "Yonasan Schwartz",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-06-29"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8765,
        timestamps: null,
        hashtags: ["Music", "YonasanSchwartz", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 34 - Jun 12, 2023
      {
        title: "Latest Talks Podcast #34 | Kiruv | ABA | Sara Schenirer History & Men's Program | Guest: Rabbi Elazar Meisels",
        episodeNumber: 34,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Kiruv | ABA | Sara Schenirer History & Men's Program.\n\nGuest: Rabbi Elazar Meisels",
        guestName: "Rabbi Elazar Meisels",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-06-12"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5432,
        timestamps: null,
        hashtags: ["Kiruv", "SaraSchenirer", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 33 - May 24, 2023
      {
        title: "Latest Talks Podcast #33 | Special Lag Baomer Episode | Beis Hashchita | Touring | Guest: Yitzchok Hershkowitz",
        episodeNumber: 33,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Special Lag Baomer Episode!\n\nTopics: Beis Hashchita | Touring.\n\nGuest: Yitzchok Hershkowitz",
        guestName: "Yitzchok Hershkowitz",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-05-24"),
        scheduledAt: null,
        transcript: null,
        viewCount: 7654,
        timestamps: null,
        hashtags: ["LagBaomer", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 32 - Apr 16, 2023
      {
        title: "Latest Talks Podcast #32 | Pesach Episode | Chabura's | Housing | Plays | Spoiled Milk | Guest: Chaim Itzkowitz",
        episodeNumber: 32,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Pesach Episode!\n\nTopics: Chabura's | Housing | Plays | Spoiled Milk.\n\nGuest: Chaim Itzkowitz",
        guestName: "Chaim Itzkowitz",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-04-16"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["Pesach", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 30 - Jan 25, 2023 (Note: Episode 31 is missing from original podcast)
      {
        title: "Latest Talks Podcast #30 | Shidduchim | His Magna-Tiles Lawsuit | Chaburas | Music | Guest: Yonasan Schwartz",
        episodeNumber: 30,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Shidduchim | His Magna-Tiles Lawsuit | Chaburas | Music.\n\nGuest: Yonasan Schwartz",
        guestName: "Yonasan Schwartz",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2023-01-25"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8765,
        timestamps: null,
        hashtags: ["Shidduchim", "Music", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 29 - Dec 29, 2022
      {
        title: "Latest Talks Podcast #29 | How Simcha Is Helping People | Personal Stories | City Cameras | Guest: Assemblyman Simcha Eichenstein",
        episodeNumber: 29,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: How Simcha Is Helping People | Personal Stories | City Cameras.\n\nGuest: Assemblyman Simcha Eichenstein\nAssembly District 48 | https://nyassembly.gov/mem/Simcha-Eichenstein",
        guestName: "Assemblyman Simcha Eichenstein",
        guestContact: "@simchaeichenstein8558",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-12-29"),
        scheduledAt: null,
        transcript: null,
        viewCount: 12345,
        timestamps: null,
        hashtags: ["Politics", "SimchaEichenstein", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 28 - Nov 16, 2022
      {
        title: "Latest Talks Podcast #28 | Parents Struggling With Children | Kesher Nafshi Shabbasim | Guest: R' Gedalia Miller",
        episodeNumber: 28,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Parents Struggling With Children | Kesher Nafshi Shabbasim.\n\nGuest: R' Gedalia Miller - @Kesher Nafshi\nDonate to Kesher Nafshi: https://keshernafshi.org/latesttalks",
        guestName: "R' Gedalia Miller",
        guestContact: "keshernafshi.org",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-11-16"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8765,
        timestamps: null,
        hashtags: ["Parenting", "KesherNafshi", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 27 - Sep 4, 2022
      {
        title: "Latest Talks Podcast #27 | Kosher Vacation Rentals - How He Sold Shares To An Employee | Guest: Shaya Weinberger",
        episodeNumber: 27,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Kosher Vacation Rentals - How He Sold Shares To An Employee.\n\nGuest: Shaya Weinberger - CEO of Luxury Kosher Villas\nhttps://LuxuryKosherVillas.com | +1305-650-8830",
        guestName: "Shaya Weinberger",
        guestContact: "LuxuryKosherVillas.com",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-09-04"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["Business", "Travel", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 26 - Aug 16, 2022
      {
        title: "Latest Talks Podcast #26 | How To Build Your Brand - Strategy - Becoming A Designer | Guest: Yanky Perl",
        episodeNumber: 26,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: How To Build Your Brand - Strategy - Becoming A Designer.\n\nGuest: Yanky Perl - Art Director\nhttps://YankyPerl.com",
        guestName: "Yanky Perl",
        guestContact: "YankyPerl.com",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-08-16"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5432,
        timestamps: null,
        hashtags: ["Design", "Branding", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 25 - Jul 18, 2022
      {
        title: "Latest Talks Podcast #25 | Real Estate Deal - Adorama Sales Dept. - Thank You Hashem | Guest: Ari Berkowitz",
        episodeNumber: 25,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Real Estate Deal - Adorama Sales Dept. - Thank You Hashem.\n\nGuest: Ari Berkowitz - #TYH\nhttps://ThankYouHashem.com",
        guestName: "Ari Berkowitz",
        guestContact: "ThankYouHashem.com",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-07-18"),
        scheduledAt: null,
        transcript: null,
        viewCount: 9876,
        timestamps: null,
        hashtags: ["ThankYouHashem", "RealEstate", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 24 - Jul 4, 2022
      {
        title: "Latest Talks Podcast #24 | Is The Golem of Prague Real? - Kankan Magazine - Genealogy | Guest: Yossi Kwadrat",
        episodeNumber: 24,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Is The Golem of Prague Real? - Kankan Magazine - Genealogy.\n\nGuest: Yossi Kwadrat - Jewish Historian",
        guestName: "Yossi Kwadrat",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-07-04"),
        scheduledAt: null,
        transcript: null,
        viewCount: 7654,
        timestamps: null,
        hashtags: ["History", "Golem", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 23 - Jun 20, 2022
      {
        title: "Latest Talks Podcast #23 | Managing Employees - Why Ads Are Effective - Life/Business | Guest: Meny Hoffman",
        episodeNumber: 23,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Managing Employees - Why Ads Are Effective - Life/Business.\n\nGuest: Meny Hoffman - Ptex Group\nhttps://ptexgroup.com | +1 888-977-7839",
        guestName: "Meny Hoffman",
        guestContact: "ptexgroup.com",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-06-20"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["Business", "Management", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 22 - Jun 7, 2022
      {
        title: "Latest Talks Podcast #22 | Special Shavuos Episode - Korns Hachnosos Sefer Torah Truck | Guest: Shulem Pesach Korn",
        episodeNumber: 22,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Special Shavuos Episode!\n\nTopics: Korns Hachnosos Sefer Torah Truck.\n\nGuest: Shulem Pesach Korn\n+1 845-642-7204 | http://www.torahtruck.com/",
        guestName: "Shulem Pesach Korn",
        guestContact: "torahtruck.com",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-06-07"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5432,
        timestamps: null,
        hashtags: ["Shavuos", "SeferTorah", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 21 - May 29, 2022
      {
        title: "Latest Talks Podcast #21 | Selling on Amazon - Founding Bizfluence App - Investments | Guest: Joel Wolh",
        episodeNumber: 21,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Selling on Amazon - Founding Bizfluence App - Investments.\n\nGuest: Joel Wolh - CEO of Bizfluence App\nTo invest in Bizfluence, WhatsApp us on 718-812-1400",
        guestName: "Joel Wolh",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-05-29"),
        scheduledAt: null,
        transcript: null,
        viewCount: 4321,
        timestamps: null,
        hashtags: ["Amazon", "Startup", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 20 - May 2, 2022
      {
        title: "Latest Talks Podcast #20 | Shidduchim - Second Marriage - 30 Seconds Of Inspiration | Guest: Rabbi Shloime Ehrlich",
        episodeNumber: 20,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Shidduchim - Second Marriage - 30 Seconds Of Inspiration.\n\nGuest: Rabbi Shloime Ehrlich\nhttps://rabbiehrlich.org | +1 845-659-4897",
        guestName: "Rabbi Shloime Ehrlich",
        guestContact: "rabbiehrlich.org",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-05-02"),
        scheduledAt: null,
        transcript: null,
        viewCount: 7654,
        timestamps: null,
        hashtags: ["Shidduchim", "Inspiration", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 19 - Apr 13, 2022
      {
        title: "Latest Talks Podcast #19 | Traveling - Filming/Editing - Fear/Risk | Guest: Ezra Bodansky",
        episodeNumber: 19,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Traveling - Filming/Editing - Fear/Risk.\n\nGuest: Ezra Bodansky",
        guestName: "Ezra Bodansky",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-04-13"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5432,
        timestamps: null,
        hashtags: ["Travel", "Filming", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 18 - Mar 20, 2022
      {
        title: "Latest Talks Podcast #18 | Purim Episode - Comedy - Jewish Plays History - Chinuch | Guest: Ari Abramowitz",
        episodeNumber: 18,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Purim Episode!\n\nTopics: Comedy - Jewish Plays History - Chinuch.\n\nGuest: Ari Abramowitz",
        guestName: "Ari Abramowitz",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-03-20"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["Purim", "Comedy", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 17 - Jan 26, 2022
      {
        title: "Latest Talks Podcast #17 | What Is A Business - Sales Psychology - Business System | Guest: Rabbi Issamar Ginzberg",
        episodeNumber: 17,
        youtubeUrl: "https://www.youtube.com/watch?v=UZDzIOSHTZo",
        youtubeId: "UZDzIOSHTZo",
        thumbnailUrl: "https://i.ytimg.com/vi/UZDzIOSHTZo/hqdefault.jpg",
        description: "Topics: What Is A Business - Sales Psychology - Business System.\n\nGuest: Rabbi Issamar Ginzberg - Business Consultant\nhttps://rabbiissamar.com",
        guestName: "Rabbi Issamar Ginzberg",
        guestContact: "rabbiissamar.com",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2022-01-26"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8765,
        timestamps: null,
        hashtags: ["Business", "Sales", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 16 - Dec 20, 2021
      {
        title: "Latest Talks Podcast #16 | What Is The Real TECHEILES?? - The Camel That Didn't Move! | Guest: Rabbi Yiddy Fuxman",
        episodeNumber: 16,
        youtubeUrl: "https://www.youtube.com/watch?v=-jFSevecvrg",
        youtubeId: "-jFSevecvrg",
        thumbnailUrl: "https://i.ytimg.com/vi/-jFSevecvrg/hqdefault.jpg",
        description: "Topics: What Is The Real TECHEILES?? - The Camel That Didn't Move!\n\nGuest: Rabbi Yiddy Fuxman - The Tzitzis Rebbe\nKnot The Tzitzit | +1 917-856-9486",
        guestName: "Rabbi Yiddy Fuxman",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-12-20"),
        scheduledAt: null,
        transcript: null,
        viewCount: 7654,
        timestamps: null,
        hashtags: ["Techeiles", "Tzitzis", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 15 - Nov 16, 2021
      {
        title: "Latest Talks Podcast #15 | Shulem Bayis - Cults - Chinuch | Guest: Rabbi Shea Hecht",
        episodeNumber: 15,
        youtubeUrl: "https://www.youtube.com/watch?v=9JB2GuR7Ykg",
        youtubeId: "9JB2GuR7Ykg",
        thumbnailUrl: "https://i.ytimg.com/vi/9JB2GuR7Ykg/hqdefault.jpg",
        description: "Topics: Shulem Bayis - Cults - Chinuch.\n\nGuest: Rabbi Shea Hecht - Crisis Counselor\nhttps://www.ncfje.org | +1 718-735-0223",
        guestName: "Rabbi Shea Hecht",
        guestContact: "ncfje.org",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-11-16"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["ShulemBayis", "Chinuch", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 14 - Aug 16, 2021
      {
        title: "Latest Talks Podcast #14 | How Rabbi Issamar Sold Icons For Apple - His Unknown Backstory - Credit Score Secrets | Guest: Rabbi Issamar Ginzberg",
        episodeNumber: 14,
        youtubeUrl: "https://www.youtube.com/watch?v=IL93cQFLmBM",
        youtubeId: "IL93cQFLmBM",
        thumbnailUrl: "https://i.ytimg.com/vi/IL93cQFLmBM/hqdefault.jpg",
        description: "Topics: How Rabbi Issamar Sold Icons For Apple - His Unknown Backstory - Credit Score Secrets.\n\nGuest: Rabbi Issamar Ginzberg - Business Consultant\nhttps://rabbiissamar.com",
        guestName: "Rabbi Issamar Ginzberg",
        guestContact: "rabbiissamar.com",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-08-16"),
        scheduledAt: null,
        transcript: null,
        viewCount: 9876,
        timestamps: null,
        hashtags: ["Apple", "Business", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 13 - Jul 6, 2021
      {
        title: "Latest Talks Podcast #13 | The Founding of Keiravtuni Shabbasim - Ringel & Co | Guest: Avrumy Ringel",
        episodeNumber: 13,
        youtubeUrl: "https://www.youtube.com/watch?v=KTln2XZ1rvo",
        youtubeId: "KTln2XZ1rvo",
        thumbnailUrl: "https://i.ytimg.com/vi/KTln2XZ1rvo/hqdefault.jpg",
        description: "Topics: The Founding of Keiravtuni Shabbasim - Ringel & Co.\n\nGuest: Avrumy Ringel - CoFounder of Keiravtuni\nOwner of Ringel & Co. (718) 475-1817",
        guestName: "Avrumy Ringel",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-07-06"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5432,
        timestamps: null,
        hashtags: ["Keiravtuni", "Business", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 12 - Jun 20, 2021
      {
        title: "Latest Talks Podcast #12 | The Founding of BP Shomrim & Dee Voch Magazine | Guest: Hershy Rubinstein",
        episodeNumber: 12,
        youtubeUrl: "https://www.youtube.com/watch?v=qlwNmEukwxY",
        youtubeId: "qlwNmEukwxY",
        thumbnailUrl: "https://i.ytimg.com/vi/qlwNmEukwxY/hqdefault.jpg",
        description: "Topics: The Founding of BP Shomrim & Dee Voch Magazine.\n\nGuest: Hershy Rubinstein - Founder of Dee Voch Magazine & BP Shomrim",
        guestName: "Hershy Rubinstein",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-06-20"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["Shomrim", "DeeVoch", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 11 - Jun 20, 2021
      {
        title: "Latest Talks Podcast #11 | Multi Level Marketing - Ponzi Schemes - Friedrich A/C | Guest: Yanky Fried",
        episodeNumber: 11,
        youtubeUrl: null,
        youtubeId: null,
        thumbnailUrl: null,
        description: "Topics: Multi Level Marketing - Ponzi Schemes - Friedrich A/C.\n\nGuest: Yanky Fried - x Multi Level Marketing Agent",
        guestName: "Yanky Fried",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-06-20"),
        scheduledAt: null,
        transcript: null,
        viewCount: 7654,
        timestamps: null,
        hashtags: ["MLM", "Business", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 10 - Jun 2, 2021
      {
        title: "Latest Talks Podcast #10 | JohnToGo History - Business Growth/Scaling - Antiques | Guest: Avrumy Breuer",
        episodeNumber: 10,
        youtubeUrl: "https://www.youtube.com/watch?v=nsiXrDGIV8k",
        youtubeId: "nsiXrDGIV8k",
        thumbnailUrl: "https://i.ytimg.com/vi/nsiXrDGIV8k/hqdefault.jpg",
        description: "Topics: JohnToGo History - Business Growth/Scaling - Antiques.\n\nGuest: Avrumy Breuer - Owner of John To Go / VIP To Go\nhttps://www.johntogo.com | +1877-564-6977",
        guestName: "Avrumy Breuer",
        guestContact: "johntogo.com",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-06-02"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5432,
        timestamps: null,
        hashtags: ["Business", "Scaling", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 9 - May 26, 2021
      {
        title: "Latest Talks Podcast #9 | The Lakewood Real Estate Market | Guest: Chaim Blau",
        episodeNumber: 9,
        youtubeUrl: "https://www.youtube.com/watch?v=UBIAToAx3dc",
        youtubeId: "UBIAToAx3dc",
        thumbnailUrl: "https://i.ytimg.com/vi/UBIAToAx3dc/hqdefault.jpg",
        description: "Topics: The Lakewood Real Estate Market.\n\nGuest: Chaim Blau - NJ Real Estate Agent\n347-786-4144",
        guestName: "Chaim Blau",
        guestContact: "347-786-4144",
        guestEmail: "Chaim@goodchoicerealtynj.com",
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-05-26"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["RealEstate", "Lakewood", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 8 - May 26, 2021
      {
        title: "Latest Talks Podcast #8 | Alkaline Water - Oil/Tea - Tomatoes | Guest: Yoely Weider",
        episodeNumber: 8,
        youtubeUrl: "https://www.youtube.com/watch?v=bpgPAl4xgRI",
        youtubeId: "bpgPAl4xgRI",
        thumbnailUrl: "https://i.ytimg.com/vi/bpgPAl4xgRI/hqdefault.jpg",
        description: "Topics: Alkaline Water - Oil/Tea - Tomatoes.\n\nGuest: Yoely Weider - Owner of Droplets\nTo buy a machine, call today: 347-986-6520",
        guestName: "Yoely Weider",
        guestContact: "347-986-6520",
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-05-26"),
        scheduledAt: null,
        transcript: null,
        viewCount: 4321,
        timestamps: null,
        hashtags: ["Health", "Water", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 7 - May 3, 2021
      {
        title: "Latest Talks Podcast #7 | Audience Questions!",
        episodeNumber: 7,
        youtubeUrl: "https://www.youtube.com/watch?v=dEh1LQjCUr4",
        youtubeId: "dEh1LQjCUr4",
        thumbnailUrl: "https://i.ytimg.com/vi/dEh1LQjCUr4/hqdefault.jpg",
        description: "Topics: Audience Questions!\n\nRaffle: We are giving away a $500 lakewoodhosts.com vacation gift card.",
        guestName: null,
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-05-03"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5432,
        timestamps: null,
        hashtags: ["QA", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 6 - May 3, 2021
      {
        title: "Latest Talks Podcast #6 | Gun Control - Dream Story - True Caller",
        episodeNumber: 6,
        youtubeUrl: "https://www.youtube.com/watch?v=FQKCE3FXGfk",
        youtubeId: "FQKCE3FXGfk",
        thumbnailUrl: "https://i.ytimg.com/vi/FQKCE3FXGfk/hqdefault.jpg",
        description: "Topics: Gun Control - Dream Story - True Caller.",
        guestName: null,
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-05-03"),
        scheduledAt: null,
        transcript: null,
        viewCount: 4321,
        timestamps: null,
        hashtags: ["GunControl", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 5 - Apr 28, 2021
      {
        title: "Latest Talks Podcast #5 | Guest: Jake Turx",
        episodeNumber: 5,
        youtubeUrl: "https://www.youtube.com/watch?v=SfftNl6iiIQ",
        youtubeId: "SfftNl6iiIQ",
        thumbnailUrl: "https://i.ytimg.com/vi/SfftNl6iiIQ/hqdefault.jpg",
        description: "Guest: Jake Turx - Senior White-House Correspondent",
        guestName: "Jake Turx",
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-04-28"),
        scheduledAt: null,
        transcript: null,
        viewCount: 12345,
        timestamps: null,
        hashtags: ["JakeTurx", "WhiteHouse", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 4 - Apr 16, 2021
      {
        title: "Latest Talks Podcast #4 | R' Shayele Kerestirer",
        episodeNumber: 4,
        youtubeUrl: "https://www.youtube.com/watch?v=So-B2SRmkLM",
        youtubeId: "So-B2SRmkLM",
        thumbnailUrl: "https://i.ytimg.com/vi/So-B2SRmkLM/hqdefault.jpg",
        description: "Special episode in honor of the Yurtzeit of the holy Tzadik R' Shayele Kerestirer.",
        guestName: null,
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-04-16"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8765,
        timestamps: null,
        hashtags: ["Kerestirer", "Yurtzeit", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 3 - Apr 13, 2021
      {
        title: "Latest Talks Podcast #3 | Vaccines - Spirit Airlines - Alzheimer's",
        episodeNumber: 3,
        youtubeUrl: "https://www.youtube.com/watch?v=6u01PtVblI0",
        youtubeId: "6u01PtVblI0",
        thumbnailUrl: "https://i.ytimg.com/vi/6u01PtVblI0/hqdefault.jpg",
        description: "Topics: Vaccines - Spirit Airlines - Alzheimer's.",
        guestName: null,
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-04-13"),
        scheduledAt: null,
        transcript: null,
        viewCount: 5432,
        timestamps: null,
        hashtags: ["Health", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 2 - Apr 7, 2021
      {
        title: "Latest Talks Podcast #2 | Anti-Semitism - Dry Goods - Trump",
        episodeNumber: 2,
        youtubeUrl: "https://www.youtube.com/watch?v=JS62you9XUk",
        youtubeId: "JS62you9XUk",
        thumbnailUrl: "https://i.ytimg.com/vi/JS62you9XUk/hqdefault.jpg",
        description: "Topics: Anti-Semitism - Dry Goods - Trump.",
        guestName: null,
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-04-07"),
        scheduledAt: null,
        transcript: null,
        viewCount: 6543,
        timestamps: null,
        hashtags: ["Current", "LatestTalksPodcast"],
        driveLink: null,
      },
      // Episode 1 - Apr 7, 2021
      {
        title: "Latest Talks Podcast #1 | Chruptza - Tesla/Bitcoin - NFTs",
        episodeNumber: 1,
        youtubeUrl: "https://www.youtube.com/watch?v=udO13Q0EtC0",
        youtubeId: "udO13Q0EtC0",
        thumbnailUrl: "https://i.ytimg.com/vi/udO13Q0EtC0/hqdefault.jpg",
        description: "Welcome to the Latest Talks Podcast! Here we shmooze and try to cover all kinds of interesting topics, so you can enjoy top-quality Yiddish entertainment.\n\nTopics: Chruptza - Tesla/Bitcoin - NFTs.",
        guestName: null,
        guestContact: null,
        guestEmail: null,
        hostName: "Pinchus Raab",
        studioName: null,
        category: "podcast",
        type: "video",
        status: "published",
        publishedAt: new Date("2021-04-07"),
        scheduledAt: null,
        transcript: null,
        viewCount: 8765,
        timestamps: null,
        hashtags: ["Bitcoin", "NFTs", "LatestTalksPodcast"],
        driveLink: null,
      },
    ];

    allEpisodes.forEach(ep => {
      const id = randomUUID();
      this.episodes.set(id, {
        ...ep,
        id,
        createdAt: ep.publishedAt || new Date(),
      });
    });

    // Seed sample guests
    const sampleGuests: Omit<Guest, "id" | "createdAt">[] = [
      {
        name: "Yoel Gold",
        title: "Filmmaker & Producer",
        company: "Hashkifa Studios",
        bio: "Award-winning filmmaker creating inspiring Jewish content. Known for his powerful documentaries and viral videos that touch hearts worldwide.",
        imageUrl: null,
        email: "info@hashkifa.com",
        phone: null,
        website: "https://hashkifa.com",
        socialLinks: [
          { platform: "instagram", url: "https://instagram.com/hashkifa" },
        ],
        episodeIds: null,
        featured: true,
        status: "published",
      },
      {
        name: "Mendy Feferkorn",
        title: "Financial Advisor & Speaker",
        company: "Adir Publishing",
        bio: "Public speaker on financial planning, helping Orthodox Jewish families build wealth and secure their futures.",
        imageUrl: null,
        email: "mendy@feferkorn.com",
        phone: null,
        website: "https://mendyfeferkorn.com",
        socialLinks: null,
        episodeIds: null,
        featured: true,
        status: "published",
      },
      {
        name: "Moshe Berish Teitelbaum",
        title: "Co-Founder & CTO",
        company: "CherryContact",
        bio: "Tech entrepreneur building innovative solutions. Passionate about startups, venture capital, and the intersection of technology with Jewish life.",
        imageUrl: null,
        email: "moshe@teitelbaum.me",
        phone: null,
        website: null,
        socialLinks: null,
        episodeIds: null,
        featured: true,
        status: "published",
      },
      {
        name: "Moishe Katz",
        title: "CEO",
        company: "United Refuah HealthShare",
        bio: "Leading the affordable Jewish alternative to health insurance, helping families access quality healthcare.",
        imageUrl: null,
        email: null,
        phone: null,
        website: "https://unitedrefuah.org",
        socialLinks: null,
        episodeIds: null,
        featured: true,
        status: "published",
      },
      {
        name: "Pinny Glick",
        title: "Marketing Expert & Comedy Writer",
        company: "Picnic",
        bio: "Creative marketing professional with a talent for comedy writing and technology innovation.",
        imageUrl: null,
        email: null,
        phone: null,
        website: null,
        socialLinks: null,
        episodeIds: null,
        featured: false,
        status: "published",
      },
    ];

    sampleGuests.forEach(g => {
      const id = randomUUID();
      this.guests.set(id, {
        ...g,
        id,
        createdAt: new Date(),
      });
    });

    // Seed community discussions about episodes
    const sampleDiscussions: Omit<Discussion, "id" | "createdAt">[] = [
      {
        authorName: "Yossi K.",
        authorEmail: null,
        title: "Episode #60 Lev Leyeled - Such an inspiring story!",
        content: "Just finished watching the Lev Leyeled episode and I'm blown away. The stories from Gershon Mendel Taub about helping families in need really touched my heart. Does anyone know how we can get involved with their organization?",
        category: "podcast",
        status: "approved",
        likes: 24,
      },
      {
        authorName: "Menachem B.",
        authorEmail: null,
        title: "Financial Planning Episode - Game Changer for My Family",
        content: "The episode with Mendy Feferkorn (#59) really opened my eyes to proper financial planning. His advice about starting early and being consistent is something every young family should hear. I've already started implementing some of his strategies. Who else found this episode helpful?",
        category: "podcast",
        status: "approved",
        likes: 18,
      },
      {
        authorName: "Chaim S.",
        authorEmail: null,
        title: "Yoel Gold's Story - Need More Episodes Like This",
        content: "Episode #57 with Yoel Gold was incredible. His openness about his personal journey and the Klei Hamikdosh project is so inspiring. The way Pinchus conducts these interviews really brings out the best in guests. Looking forward to seeing Yoel back on the show!",
        category: "podcast",
        status: "approved",
        likes: 31,
      },
      {
        authorName: "Dovid L.",
        authorEmail: null,
        title: "Tech & Startups Episode - Great for Young Entrepreneurs",
        content: "Really enjoyed the conversation about tech startups and AI in episode #58. As someone working in tech, it's refreshing to see these topics discussed from a Torah perspective. The part about AI Shidduchim was fascinating - what does everyone think about that?",
        category: "podcast",
        status: "approved",
        likes: 15,
      },
      {
        authorName: "Sarah M.",
        authorEmail: null,
        title: "United Refuah Episode Changed Our Healthcare Decision",
        content: "After watching the United Refuah episode (#56), my husband and I looked into HealthShare options and it's been a blessing for our family. The transparency Moishe Katz showed about how it works gave us confidence to make the switch. Thank you Latest Talks for covering these practical topics!",
        category: "lifestyle",
        status: "approved",
        likes: 22,
      },
      {
        authorName: "Shmuel T.",
        authorEmail: null,
        title: "Suggestion: More Episodes About Mental Health",
        content: "I love the variety of topics on Latest Talks. Would be amazing to see more episodes focusing on mental health and wellbeing in the frum community. These conversations are so important and Pinchus has a way of making guests feel comfortable discussing sensitive topics.",
        category: "general",
        status: "approved",
        likes: 45,
      },
      {
        authorName: "Rivka G.",
        authorEmail: null,
        title: "Watching on El Al - Best Way to Pass the Time!",
        content: "Just got back from Eretz Yisroel and I watched 3 Latest Talks episodes on the flight! So nice to have quality Yiddish content available on El Al. The time flew by (pun intended). Anyone else discover Latest Talks through in-flight entertainment?",
        category: "general",
        status: "approved",
        likes: 28,
      },
      {
        authorName: "Ari W.",
        authorEmail: null,
        title: "Episode #50 Badchen Interview - Absolute Classic",
        content: "Went back to watch the Badchen episode (#50) and it's still one of my favorites. The stories about the Viznitz Rebbe and the insights into the badchanus profession were fascinating. This is the kind of content that preserves our mesorah. Yasher koach!",
        category: "torah",
        status: "approved",
        likes: 33,
      },
    ];

    sampleDiscussions.forEach((d, index) => {
      const id = randomUUID();
      this.discussions.set(id, {
        ...d,
        id,
        createdAt: new Date(Date.now() - (index * 2 + 1) * 24 * 60 * 60 * 1000),
      });
    });

    // Add some replies to discussions
    const discussionIds = Array.from(this.discussions.keys());
    if (discussionIds.length > 0) {
      const sampleReplies = [
        { discussionId: discussionIds[0], authorName: "Moshe P.", content: "You can reach out to Lev Leyeled through their website LevLeyeled.org. They have volunteer opportunities and ways to donate. Amazing organization!" },
        { discussionId: discussionIds[0], authorName: "Yitzy R.", content: "I was at the live podcast event - the energy in the room was unbelievable. So glad they recorded it for everyone to see." },
        { discussionId: discussionIds[2], authorName: "Dovi K.", content: "Yoel Gold's content on Hashkifa is also amazing. His short films are so powerful. Agree that he should come back for another episode!" },
        { discussionId: discussionIds[5], authorName: "Chana L.", content: "100% agree! Mental health is such an important topic. Would love to see professionals from our community share their insights." },
        { discussionId: discussionIds[6], authorName: "Yanky F.", content: "Same here! Discovered Latest Talks on a flight to Israel last year and I've been hooked ever since. Now I listen to every new episode." },
      ];

      sampleReplies.forEach(r => {
        const id = randomUUID();
        this.discussionReplies.set(id, {
          id,
          discussionId: r.discussionId,
          authorName: r.authorName,
          authorEmail: null,
          content: r.content,
          status: "approved",
          createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        });
      });
    }

    // Seed newsletter subscribers
    const sampleSubscribers = [
      { email: "yossi.k@gmail.com", name: "Yossi Katz", status: "active" },
      { email: "menachem.b@outlook.com", name: "Menachem Berger", status: "active" },
      { email: "chaim.s@yahoo.com", name: "Chaim Schwartz", status: "active" },
      { email: "dovid.l@gmail.com", name: "Dovid Levy", status: "active" },
      { email: "sarah.m@gmail.com", name: "Sarah Miller", status: "active" },
      { email: "shmuel.t@hotmail.com", name: "Shmuel Teitelbaum", status: "active" },
      { email: "rivka.g@gmail.com", name: "Rivka Goldstein", status: "active" },
      { email: "ari.w@outlook.com", name: "Ari Weinberg", status: "active" },
      { email: "moshe.p@gmail.com", name: "Moshe Perl", status: "active" },
      { email: "yitzy.r@yahoo.com", name: "Yitzy Rosenfeld", status: "active" },
      { email: "dovi.k@gmail.com", name: "Dovi Klein", status: "active" },
      { email: "chana.l@outlook.com", name: "Chana Leibowitz", status: "active" },
      { email: "yanky.f@gmail.com", name: "Yanky Friedman", status: "active" },
      { email: "subscriber14@example.com", name: "Subscriber 14", status: "active" },
      { email: "subscriber15@example.com", name: "Subscriber 15", status: "active" },
      { email: "unsubscribed1@example.com", name: "Former Subscriber", status: "unsubscribed" },
      { email: "unsubscribed2@example.com", name: null, status: "unsubscribed" },
    ];

    sampleSubscribers.forEach((s, index) => {
      const id = randomUUID();
      this.subscribers.set(id, {
        id,
        email: s.email,
        name: s.name,
        status: s.status as "active" | "unsubscribed",
        source: index < 5 ? "website" : index < 10 ? "newsletter-signup" : "admin-invite",
        createdAt: new Date(Date.now() - (index + 1) * 3 * 24 * 60 * 60 * 1000),
      });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = { 
      id, 
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role || "viewer",
      status: user.status || "active",
      createdAt: new Date() 
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...user };
    this.users.set(id, updated);
    return updated;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Episodes
  async getEpisode(id: string): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }

  // Helper to populate guest info on an episode
  private async populateEpisodeGuests(episode: Episode): Promise<EpisodeWithGuests> {
    const guest = episode.guestId ? await this.getGuest(episode.guestId) : null;
    const guest2 = episode.guest2Id ? await this.getGuest(episode.guest2Id) : null;
    const guest3 = episode.guest3Id ? await this.getGuest(episode.guest3Id) : null;
    const host = episode.hostId ? await this.getGuest(episode.hostId) : null;
    return { ...episode, guest, guest2, guest3, host };
  }

  async getEpisodeWithGuests(id: string): Promise<EpisodeWithGuests | undefined> {
    const episode = await this.getEpisode(id);
    if (!episode) return undefined;
    return this.populateEpisodeGuests(episode);
  }

  async getEpisodes(filters?: { status?: string; category?: string; type?: string }): Promise<Episode[]> {
    let episodes = Array.from(this.episodes.values());
    if (filters?.status) episodes = episodes.filter(e => e.status === filters.status);
    if (filters?.category) episodes = episodes.filter(e => e.category === filters.category);
    if (filters?.type) episodes = episodes.filter(e => e.type === filters.type);
    return episodes.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
  }

  async getEpisodesWithGuests(filters?: { status?: string; category?: string; type?: string }): Promise<EpisodeWithGuests[]> {
    const episodes = await this.getEpisodes(filters);
    return Promise.all(episodes.map(ep => this.populateEpisodeGuests(ep)));
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const id = randomUUID();
    const newEpisode: Episode = { 
      id,
      title: episode.title,
      episodeNumber: episode.episodeNumber ?? null,
      youtubeUrl: episode.youtubeUrl,
      youtubeId: episode.youtubeId,
      thumbnailUrl: episode.thumbnailUrl ?? null,
      description: episode.description ?? null,
      guestId: episode.guestId ?? null,
      guest2Id: episode.guest2Id ?? null,
      guest3Id: episode.guest3Id ?? null,
      hostId: episode.hostId ?? null,
      isLive: episode.isLive ?? false,
      studioName: episode.studioName ?? null,
      timestamps: (episode.timestamps as {time: string, label: string}[] | null) ?? null,
      category: episode.category || "podcast",
      type: episode.type || "video",
      status: episode.status || "draft",
      label: episode.label ?? null,
      isPremium: episode.isPremium ?? false,
      isPremiumReleased: episode.isPremiumReleased ?? false,
      premiumReleasedAt: episode.premiumReleasedAt ?? null,
      premiumPreviewSeconds: episode.premiumPreviewSeconds ?? 60,
      publishedAt: episode.publishedAt ?? null,
      scheduledAt: episode.scheduledAt ?? null,
      transcript: episode.transcript ?? null,
      viewCount: 0,
      hashtags: episode.hashtags ?? null,
      driveLink: episode.driveLink ?? null,
      videoFileUrl: episode.videoFileUrl ?? null,
      createdAt: new Date() 
    };
    this.episodes.set(id, newEpisode);
    return newEpisode;
  }

  async updateEpisode(id: string, episode: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const existing = this.episodes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...episode };
    this.episodes.set(id, updated as Episode);
    return updated as Episode;
  }

  async deleteEpisode(id: string): Promise<boolean> {
    return this.episodes.delete(id);
  }

  async incrementEpisodeViews(id: string): Promise<void> {
    const episode = this.episodes.get(id);
    if (episode) {
      episode.viewCount = (episode.viewCount || 0) + 1;
      this.episodes.set(id, episode);
    }
  }

  async setEpisodeViewCount(id: string, viewCount: number): Promise<void> {
    const episode = this.episodes.get(id);
    if (episode) {
      episode.viewCount = viewCount;
      this.episodes.set(id, episode);
    }
  }

  // Sponsors
  async getSponsor(id: string): Promise<Sponsor | undefined> {
    return this.sponsors.get(id);
  }

  async getSponsors(): Promise<Sponsor[]> {
    return Array.from(this.sponsors.values());
  }

  async createSponsor(sponsor: InsertSponsor): Promise<Sponsor> {
    const id = randomUUID();
    const newSponsor: Sponsor = { 
      id,
      name: sponsor.name,
      logoUrl: sponsor.logoUrl ?? null,
      website: sponsor.website ?? null,
      contactName: sponsor.contactName ?? null,
      contactEmail: sponsor.contactEmail ?? null,
      contactPhone: sponsor.contactPhone ?? null,
      contractAmount: sponsor.contractAmount ?? null,
      contractStatus: sponsor.contractStatus ?? "active",
      contractEndDate: sponsor.contractEndDate ?? null,
      notes: sponsor.notes ?? null,
      createdAt: new Date() 
    };
    this.sponsors.set(id, newSponsor);
    return newSponsor;
  }

  async updateSponsor(id: string, sponsor: Partial<InsertSponsor>): Promise<Sponsor | undefined> {
    const existing = this.sponsors.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...sponsor };
    this.sponsors.set(id, updated as Sponsor);
    return updated as Sponsor;
  }

  async deleteSponsor(id: string): Promise<boolean> {
    return this.sponsors.delete(id);
  }

  // Episode Sponsors
  async getEpisodeSponsors(episodeId: string): Promise<(EpisodeSponsor & { sponsor: Sponsor })[]> {
    const epSponsors = Array.from(this.episodeSponsors.values()).filter(es => es.episodeId === episodeId);
    return epSponsors.map(es => ({
      ...es,
      sponsor: this.sponsors.get(es.sponsorId)!,
    })).filter(es => es.sponsor);
  }

  async getSponsorEpisodes(sponsorId: string): Promise<(EpisodeSponsor & { episode: Episode })[]> {
    const epSponsors = Array.from(this.episodeSponsors.values()).filter(es => es.sponsorId === sponsorId);
    return epSponsors.map(es => ({
      ...es,
      episode: this.episodes.get(es.episodeId)!,
    })).filter(es => es.episode);
  }

  async addEpisodeSponsor(episodeSponsor: InsertEpisodeSponsor): Promise<EpisodeSponsor> {
    const id = randomUUID();
    const newEpSponsor: EpisodeSponsor = { 
      id,
      episodeId: episodeSponsor.episodeId,
      sponsorId: episodeSponsor.sponsorId,
      adText: episodeSponsor.adText ?? null,
      promoCode: episodeSponsor.promoCode ?? null,
      promoLink: episodeSponsor.promoLink ?? null,
      timestampStart: episodeSponsor.timestampStart ?? null,
    };
    this.episodeSponsors.set(id, newEpSponsor);
    return newEpSponsor;
  }

  async removeEpisodeSponsor(id: string): Promise<boolean> {
    return this.episodeSponsors.delete(id);
  }

  // Subscribers
  async getSubscriber(id: string): Promise<Subscriber | undefined> {
    return this.subscribers.get(id);
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    return Array.from(this.subscribers.values()).find(s => s.email === email);
  }

  async getSubscribers(): Promise<Subscriber[]> {
    return Array.from(this.subscribers.values());
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const id = randomUUID();
    const newSubscriber: Subscriber = { 
      id,
      email: subscriber.email,
      name: subscriber.name ?? null,
      status: subscriber.status || "active",
      source: subscriber.source ?? "website",
      createdAt: new Date() 
    };
    this.subscribers.set(id, newSubscriber);
    return newSubscriber;
  }

  async updateSubscriber(id: string, subscriber: Partial<InsertSubscriber>): Promise<Subscriber | undefined> {
    const existing = this.subscribers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...subscriber };
    this.subscribers.set(id, updated as Subscriber);
    return updated as Subscriber;
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    return this.subscribers.delete(id);
  }

  // Community Photos
  async getCommunityPhoto(id: string): Promise<CommunityPhoto | undefined> {
    return this.communityPhotos.get(id);
  }

  async getCommunityPhotos(status?: string): Promise<CommunityPhoto[]> {
    let photos = Array.from(this.communityPhotos.values());
    if (status) photos = photos.filter(p => p.status === status);
    return photos.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createCommunityPhoto(photo: InsertCommunityPhoto): Promise<CommunityPhoto> {
    const id = randomUUID();
    const newPhoto: CommunityPhoto = { 
      id,
      imageUrl: photo.imageUrl,
      caption: photo.caption ?? null,
      submitterName: photo.submitterName ?? null,
      submitterEmail: photo.submitterEmail ?? null,
      status: photo.status || "pending",
      airline: photo.airline ?? null,
      flightNumber: photo.flightNumber ?? null,
      route: photo.route ?? null,
      flightDate: photo.flightDate ?? null,
      createdAt: new Date() 
    };
    this.communityPhotos.set(id, newPhoto);
    return newPhoto;
  }

  async updateCommunityPhoto(id: string, photo: Partial<InsertCommunityPhoto>): Promise<CommunityPhoto | undefined> {
    const existing = this.communityPhotos.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...photo };
    this.communityPhotos.set(id, updated as CommunityPhoto);
    return updated as CommunityPhoto;
  }

  async deleteCommunityPhoto(id: string): Promise<boolean> {
    return this.communityPhotos.delete(id);
  }

  // View Analytics
  async trackView(analytic: InsertViewAnalytic): Promise<ViewAnalytic> {
    const id = randomUUID();
    const newAnalytic: ViewAnalytic = { 
      id,
      episodeId: analytic.episodeId,
      country: analytic.country ?? null,
      city: analytic.city ?? null,
      viewedAt: new Date() 
    };
    this.viewAnalytics.set(id, newAnalytic);
    await this.incrementEpisodeViews(analytic.episodeId);
    return newAnalytic;
  }

  async getEpisodeAnalytics(episodeId: string): Promise<{country: string, count: number}[]> {
    const analytics = Array.from(this.viewAnalytics.values()).filter(a => a.episodeId === episodeId);
    const countryMap = new Map<string, number>();
    analytics.forEach(a => {
      const country = a.country || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    return Array.from(countryMap.entries()).map(([country, count]) => ({ country, count }));
  }

  async getRecentViewsByEpisode(days: number = 7): Promise<{episodeId: string, recentViews: number}[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const viewsByEpisode = new Map<string, number>();
    Array.from(this.viewAnalytics.values()).forEach(a => {
      if (a.viewedAt && new Date(a.viewedAt) >= cutoffDate) {
        viewsByEpisode.set(a.episodeId, (viewsByEpisode.get(a.episodeId) || 0) + 1);
      }
    });
    
    return Array.from(viewsByEpisode.entries())
      .map(([episodeId, recentViews]) => ({ episodeId, recentViews }))
      .sort((a, b) => b.recentViews - a.recentViews);
  }

  // Sponsor Milestones
  async getSponsorMilestones(sponsorId: string): Promise<SponsorMilestone[]> {
    return Array.from(this.sponsorMilestones.values()).filter(m => m.sponsorId === sponsorId);
  }

  async createSponsorMilestone(milestone: InsertSponsorMilestone): Promise<SponsorMilestone> {
    const id = randomUUID();
    const newMilestone: SponsorMilestone = { 
      id,
      sponsorId: milestone.sponsorId,
      episodeId: milestone.episodeId,
      milestone: milestone.milestone,
      geographicData: (milestone.geographicData as {country: string, percentage: number}[] | null) ?? null,
      emailSentAt: new Date() 
    };
    this.sponsorMilestones.set(id, newMilestone);
    return newMilestone;
  }

  async getMilestoneExists(sponsorId: string, episodeId: string, milestone: number): Promise<boolean> {
    return Array.from(this.sponsorMilestones.values()).some(
      m => m.sponsorId === sponsorId && m.episodeId === episodeId && m.milestone === milestone
    );
  }

  // Sponsor Update Recipients
  async getSponsorUpdateRecipients(sponsorId: string): Promise<SponsorUpdateRecipient[]> {
    return Array.from(this.sponsorUpdateRecipients.values())
      .filter(r => r.sponsorId === sponsorId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createSponsorUpdateRecipient(recipient: InsertSponsorUpdateRecipient): Promise<SponsorUpdateRecipient> {
    const id = randomUUID();
    const newRecipient: SponsorUpdateRecipient = {
      id,
      sponsorId: recipient.sponsorId,
      email: recipient.email,
      label: recipient.label ?? null,
      createdAt: new Date(),
    };
    this.sponsorUpdateRecipients.set(id, newRecipient);
    return newRecipient;
  }

  async deleteSponsorUpdateRecipient(id: string): Promise<boolean> {
    return this.sponsorUpdateRecipients.delete(id);
  }

  // Sponsor Email Events
  async getSponsorEmailEvents(sponsorId?: string): Promise<SponsorEmailEvent[]> {
    let events = Array.from(this.sponsorEmailEvents.values());
    if (sponsorId) {
      events = events.filter(e => e.sponsorId === sponsorId);
    }
    return events.sort((a, b) => (b.eventTimestamp?.getTime() || 0) - (a.eventTimestamp?.getTime() || 0));
  }

  async getSponsorEmailEventByToken(token: string): Promise<SponsorEmailEvent | undefined> {
    return Array.from(this.sponsorEmailEvents.values()).find(e => e.trackingToken === token);
  }

  async createSponsorEmailEvent(event: InsertSponsorEmailEvent): Promise<SponsorEmailEvent> {
    const id = randomUUID();
    const newEvent: SponsorEmailEvent = {
      id,
      sponsorId: event.sponsorId,
      recipientEmail: event.recipientEmail,
      notificationType: event.notificationType,
      eventType: event.eventType,
      trackingToken: event.trackingToken ?? null,
      episodeId: event.episodeId ?? null,
      metadata: event.metadata ?? null,
      eventTimestamp: new Date(),
    };
    this.sponsorEmailEvents.set(id, newEvent);
    return newEvent;
  }

  async updateSponsorEmailEvent(id: string, event: Partial<InsertSponsorEmailEvent>): Promise<SponsorEmailEvent | undefined> {
    const existing = this.sponsorEmailEvents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...event };
    this.sponsorEmailEvents.set(id, updated);
    return updated;
  }

  // Sponsor Inquiries
  async getSponsorInquiry(id: string): Promise<SponsorInquiry | undefined> {
    return this.sponsorInquiries.get(id);
  }

  async getSponsorInquiries(): Promise<SponsorInquiry[]> {
    return Array.from(this.sponsorInquiries.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async createSponsorInquiry(inquiry: InsertSponsorInquiry): Promise<SponsorInquiry> {
    const id = randomUUID();
    const newInquiry: SponsorInquiry = { 
      id,
      companyName: inquiry.companyName,
      contactName: inquiry.contactName,
      email: inquiry.email,
      phone: inquiry.phone ?? null,
      message: inquiry.message ?? null,
      budget: inquiry.budget ?? null,
      status: "new",
      createdAt: new Date() 
    };
    this.sponsorInquiries.set(id, newInquiry);
    return newInquiry;
  }

  async updateSponsorInquiry(id: string, inquiry: Partial<SponsorInquiry>): Promise<SponsorInquiry | undefined> {
    const existing = this.sponsorInquiries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...inquiry };
    this.sponsorInquiries.set(id, updated);
    return updated;
  }

  // Contact Messages
  async getContactMessage(id: string): Promise<ContactMessage | undefined> {
    return this.contactMessages.get(id);
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const newMessage: ContactMessage = { 
      id,
      name: message.name,
      email: message.email,
      subject: message.subject ?? null,
      message: message.message,
      status: "unread",
      createdAt: new Date() 
    };
    this.contactMessages.set(id, newMessage);
    return newMessage;
  }

  async updateContactMessage(id: string, message: Partial<ContactMessage>): Promise<ContactMessage | undefined> {
    const existing = this.contactMessages.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...message };
    this.contactMessages.set(id, updated);
    return updated;
  }

  // Hosts
  async getHosts(): Promise<Host[]> {
    return Array.from(this.hosts.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getHost(id: string): Promise<Host | undefined> {
    return this.hosts.get(id);
  }

  async createHost(host: InsertHost): Promise<Host> {
    const id = randomUUID();
    const newHost: Host = { 
      id,
      name: host.name,
      title: host.title ?? null,
      bio: host.bio ?? null,
      imageUrl: host.imageUrl ?? null,
      email: host.email ?? null,
      phone: host.phone ?? null,
      socialLinks: (host.socialLinks as {platform: string, url: string}[] | null) ?? null,
      order: host.order ?? 0,
    };
    this.hosts.set(id, newHost);
    return newHost;
  }

  async updateHost(id: string, host: Partial<InsertHost>): Promise<Host | undefined> {
    const existing = this.hosts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...host };
    this.hosts.set(id, updated as Host);
    return updated as Host;
  }

  async deleteHost(id: string): Promise<boolean> {
    return this.hosts.delete(id);
  }

  // Comments
  async getEpisodeComments(episodeId: string, status?: string): Promise<Comment[]> {
    let comments = Array.from(this.comments.values()).filter(c => c.episodeId === episodeId);
    if (status) comments = comments.filter(c => c.status === status);
    return comments.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const newComment: Comment = { 
      id,
      episodeId: comment.episodeId,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail ?? null,
      content: comment.content,
      status: "pending",
      createdAt: new Date() 
    };
    this.comments.set(id, newComment);
    return newComment;
  }

  async updateComment(id: string, comment: Partial<InsertComment>): Promise<Comment | undefined> {
    const existing = this.comments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...comment };
    this.comments.set(id, updated as Comment);
    return updated as Comment;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Guests
  async getGuests(): Promise<Guest[]> {
    return Array.from(this.guests.values()).sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    return this.guests.get(id);
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const id = randomUUID();
    const newGuest: Guest = {
      id,
      name: guest.name,
      title: guest.title ?? null,
      company: guest.company ?? null,
      bio: guest.bio ?? null,
      imageUrl: guest.imageUrl ?? null,
      email: guest.email ?? null,
      phone: guest.phone ?? null,
      website: guest.website ?? null,
      socialLinks: (guest.socialLinks as {platform: string, url: string}[] | null) ?? null,
      episodeIds: guest.episodeIds ?? null,
      featured: guest.featured ?? false,
      status: guest.status ?? "published",
      createdAt: new Date(),
    };
    this.guests.set(id, newGuest);
    return newGuest;
  }

  async updateGuest(id: string, guest: Partial<InsertGuest>): Promise<Guest | undefined> {
    const existing = this.guests.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...guest };
    this.guests.set(id, updated as Guest);
    return updated as Guest;
  }

  async deleteGuest(id: string): Promise<boolean> {
    return this.guests.delete(id);
  }

  // Members (Latest Talks+ subscribers)
  async getMember(id: string): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(m => m.email.toLowerCase() === email.toLowerCase());
  }

  async getMemberByStripeCustomerId(customerId: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(m => m.stripeCustomerId === customerId);
  }

  async findDuplicateMembers(criteria: { email: string; name?: string; phone?: string }): Promise<{ field: string; member: Member } | null> {
    const allMembers = Array.from(this.members.values());
    const emailMatch = allMembers.find(m => m.email.toLowerCase() === criteria.email.toLowerCase());
    if (emailMatch) return { field: "email", member: emailMatch };
    if (criteria.phone) {
      const normalizedPhone = criteria.phone.replace(/\D/g, "");
      if (normalizedPhone.length >= 7) {
        const phoneMatch = allMembers.find(m => m.phone && m.phone.replace(/\D/g, "") === normalizedPhone);
        if (phoneMatch) return { field: "phone", member: phoneMatch };
      }
    }
    if (criteria.name) {
      const normalizedName = criteria.name.trim().toLowerCase();
      if (normalizedName.length >= 2) {
        const nameMatch = allMembers.find(m => m.name.trim().toLowerCase() === normalizedName);
        if (nameMatch) return { field: "name", member: nameMatch };
      }
    }
    return null;
  }

  async getMembers(): Promise<Member[]> {
    return Array.from(this.members.values()).sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  async createMember(member: InsertMember): Promise<Member> {
    const id = randomUUID();
    const newMember: Member = {
      id,
      email: member.email,
      password: member.password,
      name: member.name,
      phone: member.phone ?? null,
      replitId: member.replitId ?? null,
      profileImageUrl: member.profileImageUrl ?? null,
      stripeCustomerId: null,
      subscriptionStatus: "inactive",
      subscriptionId: null,
      subscriptionEndDate: null,
      planType: member.planType ?? "monthly",
      customPrice: member.customPrice ?? null,
      paymentMethod: member.paymentMethod ?? null,
      notes: member.notes ?? null,
      adminApproved: member.adminApproved ?? true,
      createdAt: new Date(),
    };
    this.members.set(id, newMember);
    return newMember;
  }

  async getMemberByReplitId(replitId: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(m => m.replitId === replitId);
  }

  async upsertMemberByReplitId(data: { replitId: string; email: string; name: string; profileImageUrl?: string }): Promise<Member> {
    let member = await this.getMemberByReplitId(data.replitId);
    if (member) {
      return await this.updateMember(member.id, {
        email: data.email,
        name: data.name,
        profileImageUrl: data.profileImageUrl ?? member.profileImageUrl,
      }) as Member;
    }
    member = await this.getMemberByEmail(data.email);
    if (member) {
      return await this.updateMember(member.id, {
        replitId: data.replitId,
        profileImageUrl: data.profileImageUrl ?? member.profileImageUrl,
      }) as Member;
    }
    return await this.createMember({
      email: data.email,
      name: data.name,
      password: "",
      replitId: data.replitId,
      profileImageUrl: data.profileImageUrl,
    });
  }

  async updateMember(id: string, member: Partial<Member>): Promise<Member | undefined> {
    const existing = this.members.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...member };
    this.members.set(id, updated as Member);
    return updated as Member;
  }

  async deleteMember(id: string): Promise<boolean> {
    return this.members.delete(id);
  }

  // Subscription History
  async getSubscriptionHistory(memberId: string): Promise<SubscriptionHistory[]> {
    return Array.from(this.subscriptionHistory.values())
      .filter(h => h.memberId === memberId)
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
  }

  async createSubscriptionHistory(history: InsertSubscriptionHistory): Promise<SubscriptionHistory> {
    const id = randomUUID();
    const newHistory: SubscriptionHistory = {
      id,
      memberId: history.memberId,
      event: history.event,
      amount: history.amount ?? null,
      stripeEventId: history.stripeEventId ?? null,
      createdAt: new Date(),
    };
    this.subscriptionHistory.set(id, newHistory);
    return newHistory;
  }

  // Premium Episodes
  async getPremiumEpisodes(): Promise<Episode[]> {
    return Array.from(this.episodes.values())
      .filter(e => e.isPremium && e.status === "published")
      .sort((a, b) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bDate - aDate;
      });
  }

  // Discussions
  async getDiscussions(status?: string): Promise<Discussion[]> {
    let discussions = Array.from(this.discussions.values());
    if (status) {
      discussions = discussions.filter(d => d.status === status);
    }
    return discussions.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  async getDiscussion(id: string): Promise<Discussion | undefined> {
    return this.discussions.get(id);
  }

  async createDiscussion(discussion: InsertDiscussion): Promise<Discussion> {
    const id = randomUUID();
    const newDiscussion: Discussion = {
      id,
      authorName: discussion.authorName,
      authorEmail: discussion.authorEmail ?? null,
      title: discussion.title,
      content: discussion.content,
      category: discussion.category ?? "general",
      status: "pending",
      likes: 0,
      createdAt: new Date(),
    };
    this.discussions.set(id, newDiscussion);
    return newDiscussion;
  }

  async updateDiscussion(id: string, discussion: Partial<Discussion>): Promise<Discussion | undefined> {
    const existing = this.discussions.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...discussion };
    this.discussions.set(id, updated as Discussion);
    return updated as Discussion;
  }

  async deleteDiscussion(id: string): Promise<boolean> {
    // Also delete all replies
    Array.from(this.discussionReplies.values())
      .filter(r => r.discussionId === id)
      .forEach(r => this.discussionReplies.delete(r.id));
    return this.discussions.delete(id);
  }

  // Discussion Replies
  async getDiscussionReplies(discussionId: string): Promise<DiscussionReply[]> {
    return Array.from(this.discussionReplies.values())
      .filter(r => r.discussionId === discussionId)
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aDate - bDate; // oldest first for replies
      });
  }

  async createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply> {
    const id = randomUUID();
    const newReply: DiscussionReply = {
      id,
      discussionId: reply.discussionId,
      authorName: reply.authorName,
      authorEmail: reply.authorEmail ?? null,
      content: reply.content,
      status: "approved",
      createdAt: new Date(),
    };
    this.discussionReplies.set(id, newReply);
    return newReply;
  }

  async deleteDiscussionReply(id: string): Promise<boolean> {
    return this.discussionReplies.delete(id);
  }

  // Email Notifications (Marketing)
  async getEmailNotifications(filters?: { type?: string; status?: string }): Promise<EmailNotification[]> {
    let notifications = Array.from(this.emailNotifications.values());
    if (filters?.type) {
      notifications = notifications.filter(n => n.type === filters.type);
    }
    if (filters?.status) {
      notifications = notifications.filter(n => n.status === filters.status);
    }
    return notifications.sort((a, b) => {
      const aDate = a.triggeredAt ? new Date(a.triggeredAt).getTime() : 0;
      const bDate = b.triggeredAt ? new Date(b.triggeredAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  async getEmailNotification(id: string): Promise<EmailNotification | undefined> {
    return this.emailNotifications.get(id);
  }

  async createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification> {
    const id = randomUUID();
    const newNotification: EmailNotification = {
      id,
      type: notification.type,
      subject: notification.subject,
      htmlContent: notification.htmlContent ?? null,
      status: notification.status ?? "pending",
      recipientCount: notification.recipientCount ?? 0,
      sentCount: 0,
      failedCount: 0,
      episodeId: notification.episodeId ?? null,
      sponsorId: notification.sponsorId ?? null,
      milestone: notification.milestone ?? null,
      metadata: notification.metadata ?? null,
      triggeredAt: new Date(),
      sentAt: null,
    };
    this.emailNotifications.set(id, newNotification);
    return newNotification;
  }

  async updateEmailNotification(id: string, notification: Partial<EmailNotification>): Promise<EmailNotification | undefined> {
    const existing = this.emailNotifications.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...notification };
    this.emailNotifications.set(id, updated as EmailNotification);
    return updated as EmailNotification;
  }

  // Sponsor View Metrics
  async getSponsorViewMetric(sponsorId: string): Promise<SponsorViewMetric | undefined> {
    return Array.from(this.sponsorViewMetrics.values()).find(m => m.sponsorId === sponsorId);
  }

  async getSponsorViewMetrics(): Promise<SponsorViewMetric[]> {
    return Array.from(this.sponsorViewMetrics.values()).sort((a, b) => (b.totalViews ?? 0) - (a.totalViews ?? 0));
  }

  async createOrUpdateSponsorViewMetric(sponsorId: string, views: number): Promise<SponsorViewMetric> {
    const existing = await this.getSponsorViewMetric(sponsorId);
    if (existing) {
      const updated: SponsorViewMetric = {
        ...existing,
        totalViews: (existing.totalViews ?? 0) + views,
        lastUpdated: new Date(),
      };
      this.sponsorViewMetrics.set(existing.id, updated);
      return updated;
    }
    
    const id = randomUUID();
    const newMetric: SponsorViewMetric = {
      id,
      sponsorId,
      totalViews: views,
      lastMilestone: 0,
      lastUpdated: new Date(),
    };
    this.sponsorViewMetrics.set(id, newMetric);
    return newMetric;
  }

  async updateSponsorMilestone(sponsorId: string, milestone: number): Promise<void> {
    const existing = await this.getSponsorViewMetric(sponsorId);
    if (existing) {
      const updated: SponsorViewMetric = {
        ...existing,
        lastMilestone: milestone,
        lastUpdated: new Date(),
      };
      this.sponsorViewMetrics.set(existing.id, updated);
    }
  }

  // Marketing Settings
  async getMarketingSettings(): Promise<MarketingSettings> {
    if (!this.marketingSettings) {
      this.marketingSettings = {
        id: randomUUID(),
        senderName: "Latest Talks",
        senderEmail: "hello@latesttalks.com",
        replyToEmail: null,
        emailProvider: "resend",
        newEpisodeEnabled: true,
        sponsorMilestoneEnabled: true,
        updatedAt: new Date(),
      };
    }
    return this.marketingSettings;
  }

  async updateMarketingSettings(settings: Partial<MarketingSettings>): Promise<MarketingSettings> {
    const existing = await this.getMarketingSettings();
    this.marketingSettings = {
      ...existing,
      ...settings,
      updatedAt: new Date(),
    };
    return this.marketingSettings;
  }

  // Helper: Get active subscribers for email
  async getActiveSubscribers(): Promise<Subscriber[]> {
    return Array.from(this.subscribers.values()).filter(s => s.status === "active");
  }

  // Guest Applications (stub for MemStorage - use DatabaseStorage)
  private guestApplications: Map<string, GuestApplication> = new Map();

  async getGuestApplications(status?: string): Promise<GuestApplication[]> {
    const apps = Array.from(this.guestApplications.values());
    if (status) return apps.filter(a => a.status === status);
    return apps.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getGuestApplication(id: string): Promise<GuestApplication | undefined> {
    return this.guestApplications.get(id);
  }

  async createGuestApplication(application: InsertGuestApplication): Promise<GuestApplication> {
    const id = randomUUID();
    const newApp: GuestApplication = {
      id,
      ...application,
      status: "pending",
      adminNotes: null,
      scheduledDate: null,
      studioAddress: "Hashkifa Studios, Brooklyn, NY",
      confirmationEmailSent: false,
      calendarInviteSent: false,
      reminderEmailSent: false,
      createdAt: new Date(),
    };
    this.guestApplications.set(id, newApp);
    return newApp;
  }

  async updateGuestApplication(id: string, application: Partial<GuestApplication>): Promise<GuestApplication | undefined> {
    const existing = this.guestApplications.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...application };
    this.guestApplications.set(id, updated);
    return updated;
  }

  async deleteGuestApplication(id: string): Promise<boolean> {
    return this.guestApplications.delete(id);
  }

  // Upcoming Episode Info
  private upcomingEpisodeInfo: UpcomingEpisodeInfo | null = null;

  async getUpcomingEpisodeInfo(): Promise<UpcomingEpisodeInfo | undefined> {
    return this.upcomingEpisodeInfo || undefined;
  }

  async createOrUpdateUpcomingEpisodeInfo(info: InsertUpcomingEpisodeInfo): Promise<UpcomingEpisodeInfo> {
    const now = new Date();
    if (this.upcomingEpisodeInfo) {
      this.upcomingEpisodeInfo = { ...this.upcomingEpisodeInfo, ...info, updatedAt: now };
    } else {
      this.upcomingEpisodeInfo = {
        id: randomUUID(),
        ...info,
        updatedAt: now,
      } as UpcomingEpisodeInfo;
    }
    return this.upcomingEpisodeInfo;
  }

  async getPlatforms(): Promise<Platform[]> { throw new Error("Not implemented"); }
  async getPlatform(_id: string): Promise<Platform | undefined> { throw new Error("Not implemented"); }
  async createPlatform(_platform: InsertPlatform): Promise<Platform> { throw new Error("Not implemented"); }
  async updatePlatform(_id: string, _platform: Partial<InsertPlatform>): Promise<Platform | undefined> { throw new Error("Not implemented"); }
  async deletePlatform(_id: string): Promise<boolean> { throw new Error("Not implemented"); }
  async getPlatformContacts(_platformId: string): Promise<PlatformContact[]> { throw new Error("Not implemented"); }
  async createPlatformContact(_contact: InsertPlatformContact): Promise<PlatformContact> { throw new Error("Not implemented"); }
  async deletePlatformContact(_id: string): Promise<boolean> { throw new Error("Not implemented"); }
  async getPlatformUsers(_platformId: string): Promise<PlatformUser[]> { throw new Error("Not implemented"); }
  async getPlatformUser(_id: string): Promise<PlatformUser | undefined> { throw new Error("Not implemented"); }
  async getPlatformUserByEmail(_email: string): Promise<PlatformUser | undefined> { throw new Error("Not implemented"); }
  async createPlatformUser(_user: InsertPlatformUser): Promise<PlatformUser> { throw new Error("Not implemented"); }
  async updatePlatformUser(_id: string, _user: Partial<InsertPlatformUser>): Promise<PlatformUser | undefined> { throw new Error("Not implemented"); }
  async deletePlatformUser(_id: string): Promise<boolean> { throw new Error("Not implemented"); }
  async getPlatformEpisodeLinks(_platformId: string): Promise<PlatformEpisodeLink[]> { throw new Error("Not implemented"); }
  async createPlatformEpisodeLink(_link: InsertPlatformEpisodeLink): Promise<PlatformEpisodeLink> { throw new Error("Not implemented"); }
  async deletePlatformEpisodeLink(_id: string): Promise<boolean> { throw new Error("Not implemented"); }
  async getEpisodeKpis(_episodeId: string): Promise<EpisodePlatformKpi[]> { throw new Error("Not implemented"); }
  async getEpisodeKpisByPlatform(_platformId: string): Promise<EpisodePlatformKpi[]> { throw new Error("Not implemented"); }
  async getKpiByPlatformAndEpisode(_platformId: string, _episodeId: string): Promise<EpisodePlatformKpi | undefined> { throw new Error("Not implemented"); }
  async upsertEpisodeKpi(_kpi: InsertEpisodePlatformKpi): Promise<EpisodePlatformKpi> { throw new Error("Not implemented"); }
  async getKpiHistory(_platformId: string, _episodeId?: string): Promise<KpiHistory[]> { throw new Error("Not implemented"); }
  async createKpiHistoryEntry(_entry: InsertKpiHistory): Promise<KpiHistory> { throw new Error("Not implemented"); }
  async getAdminSectionView(_adminUserId: string, _sectionKey: string): Promise<AdminSectionView | null> { throw new Error("Not implemented"); }
  async upsertAdminSectionView(_adminUserId: string, _sectionKey: string): Promise<AdminSectionView> { throw new Error("Not implemented"); }
  async getAdminNotificationCounts(_adminUserId: string): Promise<Record<string, number>> { throw new Error("Not implemented"); }
  async getSponsorPromoCodes(_sponsorId: string): Promise<SponsorPromoCode[]> { throw new Error("Not implemented"); }
  async createSponsorPromoCode(_promoCode: InsertSponsorPromoCode): Promise<SponsorPromoCode> { throw new Error("Not implemented"); }
  async updateSponsorPromoCode(_id: string, _promoCode: Partial<InsertSponsorPromoCode>): Promise<SponsorPromoCode | undefined> { throw new Error("Not implemented"); }
  async deleteSponsorPromoCode(_id: string): Promise<boolean> { throw new Error("Not implemented"); }
}

import { DatabaseStorage } from "./dbStorage";

export const storage = new DatabaseStorage();
