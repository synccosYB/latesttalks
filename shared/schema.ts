import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth (OAuth)
// (IMPORTANT) This table is mandatory for OAuth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users - Admin portal users with roles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("viewer"), // admin, editor, viewer
  status: text("status").notNull().default("active"), // active, pending, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Episodes - Video/Audio content
// Guest info is linked by ID only - use the guests table for names/contact info
export const episodes = pgTable("episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  episodeNumber: integer("episode_number"),
  youtubeUrl: text("youtube_url").notNull(),
  youtubeId: text("youtube_id").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),
  guestId: varchar("guest_id"), // Link to guests table (permanent ID)
  guest2Id: varchar("guest_2_id"), // Second guest (permanent ID)
  guest3Id: varchar("guest_3_id"), // Third guest (permanent ID)
  hostId: varchar("host_id"), // Link to guests table for host (same person can be guest or host)
  // Legacy denormalized guest fields (kept for existing data; new episodes use guest IDs above)
  guestName: text("guest_name"),
  guestContact: text("guest_contact"),
  guestEmail: text("guest_email"),
  hostName: text("host_name"),
  guest2Name: text("guest_2_name"),
  guest3Name: text("guest_3_name"),
  isLive: boolean("is_live").default(false), // Live podcast indicator
  studioName: text("studio_name"),
  timestamps: jsonb("timestamps").$type<{time: string, label: string}[]>(),
  category: text("category").notNull().default("podcast"), // podcast, music-interviews, seasonal, latest-talks-plus
  type: text("type").notNull().default("video"), // video, audio
  status: text("status").notNull().default("draft"), // draft, scheduled, published
  label: text("label"), // trending, featured, new, editors-pick, popular, classic, etc.
  isPremium: boolean("is_premium").default(false), // Latest Talks+ exclusive content
  isPremiumReleased: boolean("is_premium_released").default(false), // Premium content now available to all
  premiumReleasedAt: timestamp("premium_released_at"), // When premium content was released to public
  premiumPreviewSeconds: integer("premium_preview_seconds").default(60), // Free preview duration for premium content
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  transcript: text("transcript"),
  viewCount: integer("view_count").default(0),
  hashtags: text("hashtags").array(),
  driveLink: text("drive_link"),
  videoFileUrl: text("video_file_url"), // Uploaded video file for premium content (bypasses YouTube)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({ id: true, createdAt: true, viewCount: true });
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;

// Episode with populated guest info (for API responses)
export type EpisodeWithGuests = Episode & {
  guest?: Guest | null;
  guest2?: Guest | null;
  guest3?: Guest | null;
  host?: Guest | null;
};

// Sponsors
export const sponsors = pgTable("sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  website: text("website"),
  // Company contact info (public)
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  // Promo details
  promoCode: text("promo_code"), // Promotional code for sponsor
  promoCodeExpiration: timestamp("promo_code_expiration"), // When promo code expires
  promoMemo: text("promo_memo"), // Explanation of the promo
  promoLink: text("promo_link"), // URL with promo code included
  // Point of contact (backend info)
  contactName: text("contact_name"),
  contactTitle: text("contact_title"), // Job title
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  // Personal info (backend)
  personalName: text("personal_name"),
  personalCell: text("personal_cell"),
  personalEmail: text("personal_email"),
  // Contract info
  contractAmount: integer("contract_amount"),
  contractStatus: text("contract_status").default("active"), // active, pending, expired
  contractEndDate: timestamp("contract_end_date"),
  notes: text("notes"),
  isFeatured: boolean("is_featured").default(false), // Show on Advertise page "Trusted By" section
  isPrime: boolean("is_prime").default(false), // Prime sponsor - gets golden rim on episodes
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({ id: true, createdAt: true });
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type Sponsor = typeof sponsors.$inferSelect;

// Sponsor Update Recipients - Email addresses for episode view updates
export const sponsorUpdateRecipients = pgTable("sponsor_update_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id),
  email: text("email").notNull(),
  label: text("label"), // Optional label like "Marketing", "CEO", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSponsorUpdateRecipientSchema = createInsertSchema(sponsorUpdateRecipients).omit({ id: true, createdAt: true });
export type InsertSponsorUpdateRecipient = z.infer<typeof insertSponsorUpdateRecipientSchema>;
export type SponsorUpdateRecipient = typeof sponsorUpdateRecipients.$inferSelect;

// Sponsor Email Events - Track email opens and engagement
export const sponsorEmailEvents = pgTable("sponsor_email_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id),
  recipientEmail: text("recipient_email").notNull(),
  notificationType: text("notification_type").notNull(), // episode-update, milestone, etc.
  eventType: text("event_type").notNull(), // sent, opened, clicked
  trackingToken: text("tracking_token"), // Unique token for tracking opens
  episodeId: varchar("episode_id"), // Related episode if applicable
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  eventTimestamp: timestamp("event_timestamp").defaultNow(),
});

export const insertSponsorEmailEventSchema = createInsertSchema(sponsorEmailEvents).omit({ id: true, eventTimestamp: true });
export type InsertSponsorEmailEvent = z.infer<typeof insertSponsorEmailEventSchema>;
export type SponsorEmailEvent = typeof sponsorEmailEvents.$inferSelect;

// Episode Sponsors - Many-to-many relationship
export const episodeSponsors = pgTable("episode_sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").notNull().references(() => episodes.id),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id),
  adText: text("ad_text"),
  promoCode: text("promo_code"),
  promoLink: text("promo_link"),
  timestampStart: text("timestamp_start"),
});

export const insertEpisodeSponsorSchema = createInsertSchema(episodeSponsors).omit({ id: true });
export type InsertEpisodeSponsor = z.infer<typeof insertEpisodeSponsorSchema>;
export type EpisodeSponsor = typeof episodeSponsors.$inferSelect;

// Subscribers - Email list
export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  status: text("status").notNull().default("active"), // active, unsubscribed
  source: text("source").default("website"), // website, admin-invite
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({ id: true, createdAt: true });
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

// Community Photos/Videos - In-flight entertainment section
export const communityPhotos = pgTable("community_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(), // For photos or video thumbnail
  videoUrl: text("video_url"), // For video clips
  videoThumbnailUrl: text("video_thumbnail_url"), // Auto-generated thumbnail from video
  mediaType: text("media_type").notNull().default("photo"), // photo, video
  caption: text("caption"),
  submitterName: text("submitter_name"), // Always stored (visible to admin)
  submitterEmail: text("submitter_email"), // Not shared publicly
  submitterPhone: text("submitter_phone"), // Not shared publicly
  isAnonymous: boolean("is_anonymous").default(false), // If true, name hidden from public
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  airline: text("airline"), // El Al, United, Delta, etc.
  flightNumber: text("flight_number"), // e.g., LY001, UA456
  route: text("route"), // e.g., TLV to JFK
  flightDate: text("flight_date"), // Date of the flight
  episodeId: varchar("episode_id"), // Link to episode watched (for tracking and linking) - legacy single episode
  episodeIds: text("episode_ids").array(), // Multiple episodes watched on flight
  episodeWatched: text("episode_watched"), // Which episode they watched on the flight (display text)
  enjoyedMost: text("enjoyed_most"), // What they enjoyed most about the episode
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityPhotoSchema = createInsertSchema(communityPhotos).omit({ id: true, createdAt: true });
export type InsertCommunityPhoto = z.infer<typeof insertCommunityPhotoSchema>;
export type CommunityPhoto = typeof communityPhotos.$inferSelect;

// View Analytics - Geographic tracking
export const viewAnalytics = pgTable("view_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").notNull().references(() => episodes.id),
  country: text("country"),
  city: text("city"),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

export const insertViewAnalyticSchema = createInsertSchema(viewAnalytics).omit({ id: true, viewedAt: true });
export type InsertViewAnalytic = z.infer<typeof insertViewAnalyticSchema>;
export type ViewAnalytic = typeof viewAnalytics.$inferSelect;

// Sponsor Milestone Notifications - Track emails sent
export const sponsorMilestones = pgTable("sponsor_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id),
  episodeId: varchar("episode_id").notNull().references(() => episodes.id),
  milestone: integer("milestone").notNull(), // 1000, 2000, 3000, etc.
  emailSentAt: timestamp("email_sent_at").defaultNow(),
  geographicData: jsonb("geographic_data").$type<{country: string, percentage: number}[]>(),
});

export const insertSponsorMilestoneSchema = createInsertSchema(sponsorMilestones).omit({ id: true, emailSentAt: true });
export type InsertSponsorMilestone = z.infer<typeof insertSponsorMilestoneSchema>;
export type SponsorMilestone = typeof sponsorMilestones.$inferSelect;

// Sponsor Inquiries - From "Advertise With Us" form
export const sponsorInquiries = pgTable("sponsor_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  budget: text("budget"),
  status: text("status").notNull().default("new"), // new, contacted, converted, declined
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSponsorInquirySchema = createInsertSchema(sponsorInquiries).omit({ id: true, createdAt: true, status: true });
export type InsertSponsorInquiry = z.infer<typeof insertSponsorInquirySchema>;
export type SponsorInquiry = typeof sponsorInquiries.$inferSelect;

// Contact Messages
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("unread"), // unread, read, replied
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true, status: true });
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Hosts
export const hosts = pgTable("hosts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title"),
  bio: text("bio"),
  imageUrl: text("image_url"),
  email: text("email"),
  phone: text("phone"),
  socialLinks: jsonb("social_links").$type<{platform: string, url: string}[]>(),
  order: integer("order").default(0),
});

export const insertHostSchema = createInsertSchema(hosts).omit({ id: true });
export type InsertHost = z.infer<typeof insertHostSchema>;
export type Host = typeof hosts.$inferSelect;

// Guests/Contacts - Unified table for all people (guests, hosts, etc.)
// Each person has a permanent ID that never changes. The same ID can be used for guest AND host roles.
export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  namePrefix: text("name_prefix"),
  name: text("name").notNull(),
  title: text("title"),
  company: text("company"),
  bio: text("bio"),
  imageUrl: text("image_url"),
  email: text("email"),
  website: text("website"),
  phone: text("phone"),
  socialLinks: jsonb("social_links").$type<{platform: string, url: string}[]>(),
  roles: text("roles").array().default(sql`ARRAY['guest']::text[]`), // guest, host - same person can have multiple roles
  // Legacy field (kept for existing data; episodes now link to guests via guestId)
  episodeIds: text("episode_ids").array(),
  featured: boolean("featured").default(false),
  displayOrder: integer("display_order").default(0), // For ordering hosts on about page
  status: text("status").notNull().default("published"), // published, draft
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGuestSchema = createInsertSchema(guests).omit({ id: true, createdAt: true });
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;

// Comments on episodes
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").notNull().references(() => episodes.id),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, status: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Members - Latest Talks+ premium subscribers
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull().default(""), // Empty for OAuth-only users
  name: text("name").notNull(),
  phone: text("phone"),
  // OAuth fields for Google/Replit Auth
  replitId: text("replit_id").unique(), // Replit OAuth user ID (stable identifier)
  profileImageUrl: text("profile_image_url"), // Profile picture from OAuth
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: text("subscription_status").notNull().default("pending"), // pending, active, inactive, cancelled, past_due
  subscriptionId: text("subscription_id"),
  planType: text("plan_type").default("monthly"), // monthly, annual, free, custom
  customPrice: text("custom_price"),
  paymentMethod: text("payment_method"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  notes: text("notes"), // Admin notes or user message
  adminApproved: boolean("admin_approved").default(true), // Admin can block/allow access
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMemberSchema = createInsertSchema(members).omit({ id: true, createdAt: true, stripeCustomerId: true, subscriptionId: true, subscriptionStatus: true, subscriptionEndDate: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Member login schema (for authentication)
export const memberLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type MemberLogin = z.infer<typeof memberLoginSchema>;

// Subscription History - Track payment events
export const subscriptionHistory = pgTable("subscription_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id),
  event: text("event").notNull(), // created, renewed, cancelled, payment_failed
  amount: integer("amount"), // in cents
  stripeEventId: text("stripe_event_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory).omit({ id: true, createdAt: true });
export type InsertSubscriptionHistory = z.infer<typeof insertSubscriptionHistorySchema>;
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;

// Community Discussions
export const discussions = pgTable("discussions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general"), // general, torah, podcast, lifestyle
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiscussionSchema = createInsertSchema(discussions).omit({ id: true, createdAt: true, status: true, likes: true });
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type Discussion = typeof discussions.$inferSelect;

// Discussion Replies
export const discussionReplies = pgTable("discussion_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discussionId: varchar("discussion_id").notNull().references(() => discussions.id),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  content: text("content").notNull(),
  status: text("status").notNull().default("approved"), // auto-approve replies for now
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiscussionReplySchema = createInsertSchema(discussionReplies).omit({ id: true, createdAt: true, status: true });
export type InsertDiscussionReply = z.infer<typeof insertDiscussionReplySchema>;
export type DiscussionReply = typeof discussionReplies.$inferSelect;

// Email Notifications - Track all marketing emails sent
export const emailNotifications = pgTable("email_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // new-episode, sponsor-milestone, welcome, manual
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  status: text("status").notNull().default("pending"), // pending, sending, sent, failed
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  episodeId: varchar("episode_id").references(() => episodes.id),
  sponsorId: varchar("sponsor_id").references(() => sponsors.id),
  milestone: integer("milestone"), // For sponsor milestone emails
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  triggeredAt: timestamp("triggered_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({ id: true, triggeredAt: true, sentAt: true, sentCount: true, failedCount: true });
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;

// Sponsor View Metrics - Track cumulative views per sponsor
export const sponsorViewMetrics = pgTable("sponsor_view_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id),
  totalViews: integer("total_views").default(0),
  lastMilestone: integer("last_milestone").default(0), // Last milestone email sent (1000, 2000, etc.)
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertSponsorViewMetricSchema = createInsertSchema(sponsorViewMetrics).omit({ id: true, lastUpdated: true });
export type InsertSponsorViewMetric = z.infer<typeof insertSponsorViewMetricSchema>;
export type SponsorViewMetric = typeof sponsorViewMetrics.$inferSelect;

// Upcoming Episode Info - For "Advertise on our next episode" section
export const upcomingEpisodeInfo = pgTable("upcoming_episode_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // e.g., "Upcoming Episode"
  guestName: text("guest_name"), // Guest name
  guestImageUrl: text("guest_image_url"), // URL to guest's photo
  thumbnailUrl: text("thumbnail_url"), // Episode thumbnail image URL
  topic: text("topic"), // Topic/description of what will be discussed
  releaseDate: text("release_date"), // Release date string (e.g., "December 15, 2025")
  isActive: boolean("is_active").default(true), // Show/hide the section
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUpcomingEpisodeInfoSchema = createInsertSchema(upcomingEpisodeInfo).omit({ id: true, updatedAt: true });
export type InsertUpcomingEpisodeInfo = z.infer<typeof insertUpcomingEpisodeInfoSchema>;
export type UpcomingEpisodeInfo = typeof upcomingEpisodeInfo.$inferSelect;

// Marketing Settings - Email provider configuration
export const marketingSettings = pgTable("marketing_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderName: text("sender_name").default("Latest Talks"),
  senderEmail: text("sender_email").default("hello@latesttalks.com"),
  replyToEmail: text("reply_to_email"),
  emailProvider: text("email_provider").default("resend"), // resend, sendgrid, mailgun
  newEpisodeEnabled: boolean("new_episode_enabled").default(true),
  sponsorMilestoneEnabled: boolean("sponsor_milestone_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMarketingSettingsSchema = createInsertSchema(marketingSettings).omit({ id: true, updatedAt: true });
export type InsertMarketingSettings = z.infer<typeof insertMarketingSettingsSchema>;
export type MarketingSettings = typeof marketingSettings.$inferSelect;

// ============================================
// ADMIN PORTAL - OPERATIONS MANAGEMENT
// ============================================

// Team Members - Staff and contractors
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull(), // host, manager, audio_engineer, video_editor, guest_host, contractor
  defaultRate: integer("default_rate"), // Payment rate amount (default per episode/project)
  status: text("status").notNull().default("active"), // active, inactive, on_leave
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, createdAt: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// Guest Pipeline - Potential future guests
export const guestPipeline = pgTable("guest_pipeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"), // What they would talk about
  recommendedBy: text("recommended_by"), // Who recommended this guest
  contactMethod: text("contact_method"), // primary contact method preference
  contactInfo: text("contact_info"), // Legacy field - primary contact info
  // Comprehensive contact fields
  address: text("address"),
  phone: text("phone"), // Main phone number
  cellPhone: text("cell_phone"),
  workPhone: text("work_phone"),
  personalEmail: text("personal_email"),
  workEmail: text("work_email"),
  // Social media and online presence
  linkedin: text("linkedin"),
  twitter: text("twitter"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  website: text("website"),
  otherContact: text("other_contact"), // Any other contact method
  status: text("status").notNull().default("prospect"), // prospect, contacted, scheduled, recorded, published, declined
  priority: text("priority").default("medium"), // low, medium, high
  lastContactDate: timestamp("last_contact_date"), // When last contacted
  // Scheduling fields
  scheduledDate: timestamp("scheduled_date"), // Date and time of recording
  studioAddress: text("studio_address").default("Latest Talks Studio, 123 Main Street, Brooklyn, NY 11201"), // Studio location
  googleMapsLink: text("google_maps_link").default("https://maps.google.com/?q=Latest+Talks+Studio+Brooklyn+NY"), // GPS link for the studio
  // Email notification tracking
  scheduledEmailSent: boolean("scheduled_email_sent").default(false), // Confirmation email sent
  reminder1DaySent: boolean("reminder_1day_sent").default(false), // 1 day before reminder sent
  reminder2HoursSent: boolean("reminder_2hours_sent").default(false), // 2 hours before reminder sent
  notes: text("notes"),
  episodeId: varchar("episode_id").references(() => episodes.id), // Links to episode once recorded
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGuestPipelineSchema = createInsertSchema(guestPipeline).omit({ id: true, createdAt: true });
export type InsertGuestPipeline = z.infer<typeof insertGuestPipelineSchema>;
export type GuestPipeline = typeof guestPipeline.$inferSelect;

// Episode Ad Slots - Track ad placements and revenue
export const episodeAdSlots = pgTable("episode_ad_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").notNull().references(() => episodes.id),
  slotType: text("slot_type").notNull(), // prime_time, ad_break_1, ad_break_2
  slotIndex: integer("slot_index").notNull(), // 1 or 2
  rate: integer("rate"), // Price in dollars (2500, 1500, 1000)
  sponsorId: varchar("sponsor_id").references(() => sponsors.id),
  sponsorName: text("sponsor_name"), // For non-registered sponsors
  bookingStatus: text("booking_status").default("available"), // available, booked, paid
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEpisodeAdSlotSchema = createInsertSchema(episodeAdSlots).omit({ id: true, createdAt: true });
export type InsertEpisodeAdSlot = z.infer<typeof insertEpisodeAdSlotSchema>;
export type EpisodeAdSlot = typeof episodeAdSlots.$inferSelect;

// Episode Production Costs - Track per-episode expenses
export const episodeCosts = pgTable("episode_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").notNull().references(() => episodes.id),
  costType: text("cost_type").notNull(), // host, sound_engineer, video_editor, food, add_on, shorts, other
  teamMemberId: varchar("team_member_id").references(() => teamMembers.id),
  vendorName: text("vendor_name"), // For non-team vendors
  description: text("description"),
  amount: integer("amount").notNull(), // Amount in dollars
  paid: boolean("paid").default(false),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEpisodeCostSchema = createInsertSchema(episodeCosts).omit({ id: true, createdAt: true });
export type InsertEpisodeCost = z.infer<typeof insertEpisodeCostSchema>;
export type EpisodeCost = typeof episodeCosts.$inferSelect;

// Episode Production Details - Extended episode info for admin
export const episodeProduction = pgTable("episode_production", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").notNull().references(() => episodes.id).unique(),
  productionStatus: text("production_status").default("planning"), // planning, scheduled, filmed, editing, ready, released, cancelled, hard_drive_issue
  filmedDate: timestamp("filmed_date"),
  plannedReleaseDate: timestamp("planned_release_date"),
  host1Id: varchar("host1_id").references(() => teamMembers.id),
  host1Pay: integer("host1_pay"),
  host2Id: varchar("host2_id").references(() => teamMembers.id),
  host2Pay: integer("host2_pay"),
  soundEngineerId: varchar("sound_engineer_id").references(() => teamMembers.id),
  soundEngineerPay: integer("sound_engineer_pay"),
  videoEditorId: varchar("video_editor_id").references(() => teamMembers.id),
  videoEditorPay: integer("video_editor_pay"),
  shortsEditorId: varchar("shorts_editor_id").references(() => teamMembers.id),
  shortsEditorPay: integer("shorts_editor_pay"),
  foodVendor: text("food_vendor"),
  foodCost: integer("food_cost"),
  addOns: text("add_ons"),
  addOnsCost: integer("add_ons_cost"),
  totalRevenue: integer("total_revenue"), // Calculated from ad slots
  totalCost: integer("total_cost"), // Calculated from all costs
  profit: integer("profit"), // Revenue - Cost
  musicOnTimeAd: boolean("music_on_time_ad").default(false),
  kolHaolamAd: boolean("kol_haolam_ad").default(false),
  melechHadreiverAd: boolean("melech_hadreiver_ad").default(false),
  hebdateAd: boolean("hebdate_ad").default(false),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEpisodeProductionSchema = createInsertSchema(episodeProduction).omit({ id: true, updatedAt: true });
export type InsertEpisodeProduction = z.infer<typeof insertEpisodeProductionSchema>;
export type EpisodeProduction = typeof episodeProduction.$inferSelect;

// Projects - Special projects (Tisha Bav, Chanukah, etc.)
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("planning"), // planning, in_progress, completed, cancelled
  filmedDate: timestamp("filmed_date"),
  releaseDate: timestamp("release_date"),
  budgetCap: integer("budget_cap"),
  totalSpent: integer("total_spent").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Expenses - General company expenses
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // equipment, food, rent, utilities, payroll, software, misc, phone, bank_fee
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // Amount in cents for precision
  vendor: text("vendor"),
  episodeId: varchar("episode_id").references(() => episodes.id), // Optional link to episode
  projectId: varchar("project_id").references(() => projects.id), // Optional link to project
  receiptUrl: text("receipt_url"),
  incurredDate: timestamp("incurred_date").defaultNow(),
  paid: boolean("paid").default(true),
  recurring: boolean("recurring").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Project Sponsors - Sponsors linked to projects
export const projectSponsors = pgTable("project_sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  sponsorId: varchar("sponsor_id").references(() => sponsors.id),
  sponsorName: text("sponsor_name"), // For non-registered sponsors
  amount: integer("amount"),
  tier: text("tier"), // gold, silver, bronze, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSponsorSchema = createInsertSchema(projectSponsors).omit({ id: true, createdAt: true });
export type InsertProjectSponsor = z.infer<typeof insertProjectSponsorSchema>;
export type ProjectSponsor = typeof projectSponsors.$inferSelect;

// Sponsor Deals - Track sponsor agreements and payments
export const sponsorDeals = pgTable("sponsor_deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id),
  dealName: text("deal_name").notNull(),
  amount: integer("amount").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  commissionToId: varchar("commission_to_id").references(() => teamMembers.id),
  commissionAmount: integer("commission_amount"),
  status: text("status").default("active"), // pending, active, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSponsorDealSchema = createInsertSchema(sponsorDeals).omit({ id: true, createdAt: true });
export type InsertSponsorDeal = z.infer<typeof insertSponsorDealSchema>;
export type SponsorDeal = typeof sponsorDeals.$inferSelect;

// Monthly Financials - Snapshot summaries
export const monthlyFinancials = pgTable("monthly_financials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  adIncome: integer("ad_income").default(0),
  sponsorIncome: integer("sponsor_income").default(0),
  otherIncome: integer("other_income").default(0),
  totalIncome: integer("total_income").default(0),
  payrollExpenses: integer("payroll_expenses").default(0),
  billsExpenses: integer("bills_expenses").default(0),
  softwareExpenses: integer("software_expenses").default(0),
  otherExpenses: integer("other_expenses").default(0),
  totalExpenses: integer("total_expenses").default(0),
  netProfit: integer("net_profit").default(0),
  episodesReleased: integer("episodes_released").default(0),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMonthlyFinancialSchema = createInsertSchema(monthlyFinancials).omit({ id: true, updatedAt: true });
export type InsertMonthlyFinancial = z.infer<typeof insertMonthlyFinancialSchema>;
export type MonthlyFinancial = typeof monthlyFinancials.$inferSelect;

// Yearly Ad Income Summary
export const yearlyAdIncome = pgTable("yearly_ad_income", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull().unique(),
  totalAdIncome: integer("total_ad_income").default(0),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertYearlyAdIncomeSchema = createInsertSchema(yearlyAdIncome).omit({ id: true, updatedAt: true });
export type InsertYearlyAdIncome = z.infer<typeof insertYearlyAdIncomeSchema>;
export type YearlyAdIncome = typeof yearlyAdIncome.$inferSelect;

// Ad Slot Requests - Requests for specific ad slots from potential sponsors
export const adSlotRequests = pgTable("ad_slot_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  slotType: text("slot_type").notNull(), // prime-time, ad-break-1, ad-break-2
  slotNumber: integer("slot_number").notNull(), // 1 or 2
  numberOfEpisodes: integer("number_of_episodes").notNull().default(1),
  pricePerEpisode: integer("price_per_episode").notNull(), // $2500, $1500, or $1000
  message: text("message"), // Custom requests/comments
  status: text("status").notNull().default("pending"), // pending, contacted, meeting-scheduled, approved, rejected
  meetingDate: timestamp("meeting_date"),
  meetingNotes: text("meeting_notes"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdSlotRequestSchema = createInsertSchema(adSlotRequests).omit({ id: true, createdAt: true, status: true, meetingDate: true, meetingNotes: true, adminNotes: true });
export type InsertAdSlotRequest = z.infer<typeof insertAdSlotRequestSchema>;
export type AdSlotRequest = typeof adSlotRequests.$inferSelect;

// WhatsApp Contacts - Subscribers who opt-in to WhatsApp updates
export const whatsappContacts = pgTable("whatsapp_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  waId: text("wa_id").notNull().unique(), // WhatsApp phone number (international format)
  name: text("name"),
  phone: text("phone").notNull(), // Display phone format
  optInSource: text("opt_in_source").default("website"), // website, admin, qr-code
  consentTimestamp: timestamp("consent_timestamp").defaultNow(),
  status: text("status").notNull().default("active"), // active, unsubscribed, blocked
  tags: text("tags").array(), // VIP, sponsor, listener, etc.
  notes: text("notes"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhatsappContactSchema = createInsertSchema(whatsappContacts).omit({ id: true, createdAt: true, consentTimestamp: true, lastMessageAt: true });
export type InsertWhatsappContact = z.infer<typeof insertWhatsappContactSchema>;
export type WhatsappContact = typeof whatsappContacts.$inferSelect;

// WhatsApp Message Templates - Pre-approved templates for Meta
export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // Template name in Meta
  category: text("category").notNull().default("MARKETING"), // MARKETING, UTILITY, AUTHENTICATION
  language: text("language").notNull().default("en"), // en, yi (Yiddish), he
  headerType: text("header_type"), // text, image, video, document
  headerContent: text("header_content"), // Header text or media URL placeholder
  bodyText: text("body_text").notNull(), // Main message with {{1}}, {{2}} placeholders
  footerText: text("footer_text"),
  buttons: jsonb("buttons").$type<{type: string, text: string, url?: string}[]>(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates).omit({ id: true, createdAt: true });
export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;

// WhatsApp Send Logs - Track episode broadcasts
export const whatsappSendLogs = pgTable("whatsapp_send_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").references(() => episodes.id),
  templateId: varchar("template_id").references(() => whatsappTemplates.id),
  templateName: text("template_name"),
  messageType: text("message_type").notNull().default("episode"), // episode, announcement, custom
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  readCount: integer("read_count").default(0),
  failedCount: integer("failed_count").default(0),
  sentByUserId: varchar("sent_by_user_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, sending, completed, failed
  customMessage: text("custom_message"),
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhatsappSendLogSchema = createInsertSchema(whatsappSendLogs).omit({ id: true, createdAt: true, sentAt: true, completedAt: true });
export type InsertWhatsappSendLog = z.infer<typeof insertWhatsappSendLogSchema>;
export type WhatsappSendLog = typeof whatsappSendLogs.$inferSelect;

// WhatsApp Message Details - Individual message tracking
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sendLogId: varchar("send_log_id").references(() => whatsappSendLogs.id),
  contactId: varchar("contact_id").references(() => whatsappContacts.id),
  waMessageId: text("wa_message_id"), // Meta's message ID
  status: text("status").notNull().default("pending"), // pending, sent, delivered, read, failed
  failureReason: text("failure_reason"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({ id: true, createdAt: true });
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;

// WhatsApp Webhook Events - Audit log for incoming webhooks
export const whatsappWebhookEvents = pgTable("whatsapp_webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(), // message_status, incoming_message
  waMessageId: text("wa_message_id"),
  payload: jsonb("payload"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhatsappWebhookEventSchema = createInsertSchema(whatsappWebhookEvents).omit({ id: true, createdAt: true });
export type InsertWhatsappWebhookEvent = z.infer<typeof insertWhatsappWebhookEventSchema>;
export type WhatsappWebhookEvent = typeof whatsappWebhookEvents.$inferSelect;

// Bug Reports - User submitted issues
export const bugReports = pgTable("bug_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"), // general, playback, navigation, account, payment, other
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("open"), // open, in-progress, resolved, closed, wont-fix
  reporterName: text("reporter_name"),
  reporterEmail: text("reporter_email"),
  browser: text("browser"),
  device: text("device"),
  pageUrl: text("page_url"),
  screenshotUrl: text("screenshot_url"),
  adminNotes: text("admin_notes"),
  adminResponse: text("admin_response"),
  respondedAt: timestamp("responded_at"),
  resolvedAt: timestamp("resolved_at"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const insertBugReportSchema = createInsertSchema(bugReports).omit({ id: true, createdAt: true, respondedAt: true, resolvedAt: true });
export type InsertBugReport = z.infer<typeof insertBugReportSchema>;
export type BugReport = typeof bugReports.$inferSelect;

// Guest Applications - Prospective podcast guests
export const guestApplications = pgTable("guest_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // business-owner, professional, author, community-leader, rabbi, entertainer, public-figure, other
  fullName: text("full_name").notNull(),
  preferredCommunication: text("preferred_communication").notNull().default("email"), // phone, email, whatsapp
  phone: text("phone"),
  cellPhone: text("cell_phone"),
  workPhone: text("work_phone"),
  email: text("email").notNull(),
  workEmail: text("work_email"),
  address: text("address"),
  availability: text("availability"),
  introduction: text("introduction").notNull(),
  previousAppearances: text("previous_appearances"),
  topicsOrQuestions: text("topics_or_questions"),
  linkedinUrl: text("linkedin_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  websiteUrl: text("website_url"),
  heardAboutUs: text("heard_about_us"),
  fileUrls: text("file_urls").array(),
  status: text("status").notNull().default("pending"), // pending, reviewing, accepted, declined, scheduled
  adminNotes: text("admin_notes"),
  scheduledDate: timestamp("scheduled_date"),
  studioAddress: text("studio_address").default("Hashkifa Studios, Brooklyn, NY"),
  confirmationEmailSent: boolean("confirmation_email_sent").default(false),
  calendarInviteSent: boolean("calendar_invite_sent").default(false),
  reminderEmailSent: boolean("reminder_email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGuestApplicationSchema = createInsertSchema(guestApplications).omit({ 
  id: true, 
  createdAt: true, 
  status: true, 
  adminNotes: true, 
  scheduledDate: true, 
  confirmationEmailSent: true, 
  calendarInviteSent: true, 
  reminderEmailSent: true 
});
export type InsertGuestApplication = z.infer<typeof insertGuestApplicationSchema>;
export type GuestApplication = typeof guestApplications.$inferSelect;

// Platforms - External podcast platforms that submit KPI data
export const platforms = pgTable("platforms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  podcastLink: text("podcast_link"),
  primaryContactName: text("primary_contact_name"),
  primaryContactEmail: text("primary_contact_email"),
  primaryContactPhone: text("primary_contact_phone"),
  status: text("status").notNull().default("active"), // active, disabled
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlatformSchema = createInsertSchema(platforms).omit({ id: true, createdAt: true });
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Platform = typeof platforms.$inferSelect;

// Platform Contacts - Additional contacts for a platform
export const platformContacts = pgTable("platform_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id),
  email: text("email"),
  label: text("label"), // manager, technical, owner, other
  phone: text("phone"),
  phoneLabel: text("phone_label"),
});

export const insertPlatformContactSchema = createInsertSchema(platformContacts).omit({ id: true });
export type InsertPlatformContact = z.infer<typeof insertPlatformContactSchema>;
export type PlatformContact = typeof platformContacts.$inferSelect;

// Platform Users - Login accounts for platform managers
export const platformUsers = pgTable("platform_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: boolean("must_change_password").default(true),
  status: text("status").notNull().default("active"), // active, disabled
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlatformUserSchema = createInsertSchema(platformUsers).omit({ id: true, createdAt: true });
export type InsertPlatformUser = z.infer<typeof insertPlatformUserSchema>;
export type PlatformUser = typeof platformUsers.$inferSelect;

// Platform Episode Links - Maps platform-specific episode IDs to website episode IDs
export const platformEpisodeLinks = pgTable("platform_episode_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id),
  websiteEpisodeId: varchar("website_episode_id").notNull().references(() => episodes.id),
  platformEpisodeId: text("platform_episode_id"),
});

export const insertPlatformEpisodeLinkSchema = createInsertSchema(platformEpisodeLinks).omit({ id: true });
export type InsertPlatformEpisodeLink = z.infer<typeof insertPlatformEpisodeLinkSchema>;
export type PlatformEpisodeLink = typeof platformEpisodeLinks.$inferSelect;

// Episode Platform KPIs - Performance metrics per platform per episode
export const episodePlatformKpis = pgTable("episode_platform_kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id),
  websiteEpisodeId: varchar("website_episode_id").notNull().references(() => episodes.id),
  totalWatchTimeSeconds: integer("total_watch_time_seconds"),
  views: integer("views"),
  avgWatchTimeSeconds: integer("avg_watch_time_seconds"),
  kpi1Auto: boolean("kpi1_auto").default(false),
  kpi2Auto: boolean("kpi2_auto").default(false),
  kpi3Auto: boolean("kpi3_auto").default(false),
  isLocked: boolean("is_locked").default(false),
  globalLocked: boolean("global_locked").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  updateSource: text("update_source"), // manual, admin, excel, api
});

export const insertEpisodePlatformKpiSchema = createInsertSchema(episodePlatformKpis).omit({ id: true, lastUpdated: true });
export type InsertEpisodePlatformKpi = z.infer<typeof insertEpisodePlatformKpiSchema>;
export type EpisodePlatformKpi = typeof episodePlatformKpis.$inferSelect;

// KPI History - Audit trail of all KPI changes
export const kpiHistory = pgTable("kpi_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id),
  websiteEpisodeId: varchar("website_episode_id").notNull().references(() => episodes.id),
  fieldChanged: text("field_changed").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  timestamp: timestamp("timestamp").defaultNow(),
  userId: text("user_id"),
  editSource: text("edit_source").notNull(), // manual, admin, excel, api
});

export const insertKpiHistorySchema = createInsertSchema(kpiHistory).omit({ id: true, timestamp: true });
export type InsertKpiHistory = z.infer<typeof insertKpiHistorySchema>;
export type KpiHistory = typeof kpiHistory.$inferSelect;

// Admin Section Views - Per-admin notification tracking
export const adminSectionViews = pgTable("admin_section_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id),
  sectionKey: varchar("section_key").notNull(),
  lastViewedAt: timestamp("last_viewed_at").defaultNow(),
});

export const insertAdminSectionViewSchema = createInsertSchema(adminSectionViews).omit({ id: true });
export type InsertAdminSectionView = z.infer<typeof insertAdminSectionViewSchema>;
export type AdminSectionView = typeof adminSectionViews.$inferSelect;

// Sponsor Promo Codes - Multiple promo codes per sponsor
export const sponsorPromoCodes = pgTable("sponsor_promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id),
  code: text("code").notNull(),
  expiration: timestamp("expiration"),
  link: text("link"),
  memo: text("memo"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSponsorPromoCodeSchema = createInsertSchema(sponsorPromoCodes).omit({ id: true, createdAt: true });
export type InsertSponsorPromoCode = z.infer<typeof insertSponsorPromoCodeSchema>;
export type SponsorPromoCode = typeof sponsorPromoCodes.$inferSelect;

export const eventTickets = pgTable("event_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  ticketCode: varchar("ticket_code").notNull().unique(),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone"),
  quantity: integer("quantity").notNull(),
  amountCents: integer("amount_cents").notNull(),
  paymentStatus: text("payment_status").notNull().default("paid"),
  refundReferenceNumber: text("refund_reference_number"),
  refundAmountCents: integer("refund_amount_cents"),
  refundedAt: timestamp("refunded_at"),
  solaReferenceNumber: text("sola_reference_number").notNull().unique(),
  solaAuthorizationCode: text("sola_authorization_code"),
  maskedCardNumber: text("masked_card_number"),
  cardType: text("card_type"),
  checkedInCount: integer("checked_in_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EventTicket = typeof eventTickets.$inferSelect;
