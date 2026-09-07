import { 
  users, episodes, sponsors, episodeSponsors, subscribers, communityPhotos,
  viewAnalytics, sponsorMilestones, sponsorInquiries, contactMessages,
  hosts, guests, comments, members, subscriptionHistory, discussions,
  discussionReplies, emailNotifications, sponsorViewMetrics, marketingSettings,
  teamMembers, guestPipeline, episodeAdSlots, episodeCosts, episodeProduction,
  expenses, projects, projectSponsors, sponsorDeals, monthlyFinancials, yearlyAdIncome,
  adSlotRequests, bugReports, guestApplications, upcomingEpisodeInfo,
  sponsorUpdateRecipients, sponsorEmailEvents,
  platforms, platformContacts, platformUsers, platformEpisodeLinks,
  episodePlatformKpis, kpiHistory,
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
  adminSectionViews,
  type AdminSectionView,
  whatsappContacts,
  sponsorPromoCodes,
  type SponsorPromoCode, type InsertSponsorPromoCode,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, or, ilike, gt, count } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getEpisode(id: string): Promise<Episode | undefined> {
    const [episode] = await db.select().from(episodes).where(eq(episodes.id, id));
    return episode || undefined;
  }

  async getEpisodes(filters?: { status?: string; category?: string; type?: string }): Promise<Episode[]> {
    let query = db.select().from(episodes);
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(episodes.status, filters.status));
    }
    if (filters?.category) {
      conditions.push(eq(episodes.category, filters.category));
    }
    if (filters?.type) {
      conditions.push(eq(episodes.type, filters.type));
    }
    
    // Sort by episode number DESC with NULLS LAST so episodes with numbers come first
    const orderClause = sql`${episodes.episodeNumber} DESC NULLS LAST`;
    
    if (conditions.length > 0) {
      return db.select().from(episodes).where(and(...conditions)).orderBy(orderClause);
    }
    return db.select().from(episodes).orderBy(orderClause);
  }

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

  async getEpisodesWithGuests(filters?: { status?: string; category?: string; type?: string }): Promise<EpisodeWithGuests[]> {
    const episodesList = await this.getEpisodes(filters);
    return Promise.all(episodesList.map(ep => this.populateEpisodeGuests(ep)));
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const [created] = await db.insert(episodes).values(episode).returning();
    return created;
  }

  async updateEpisode(id: string, episode: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const [updated] = await db.update(episodes).set(episode).where(eq(episodes.id, id)).returning();
    return updated || undefined;
  }

  async deleteEpisode(id: string): Promise<boolean> {
    // Delete related records first to avoid foreign key constraint errors
    await db.delete(comments).where(eq(comments.episodeId, id));
    await db.delete(episodeSponsors).where(eq(episodeSponsors.episodeId, id));
    await db.delete(viewAnalytics).where(eq(viewAnalytics.episodeId, id));
    
    // Now delete the episode
    const result = await db.delete(episodes).where(eq(episodes.id, id)).returning();
    return result.length > 0;
  }

  async incrementEpisodeViews(id: string): Promise<void> {
    await db.update(episodes).set({ viewCount: sql`${episodes.viewCount} + 1` }).where(eq(episodes.id, id));
  }

  async setEpisodeViewCount(id: string, viewCount: number): Promise<void> {
    await db.update(episodes).set({ viewCount }).where(eq(episodes.id, id));
  }

  async getSponsor(id: string): Promise<Sponsor | undefined> {
    const [sponsor] = await db.select().from(sponsors).where(eq(sponsors.id, id));
    return sponsor || undefined;
  }

  async getSponsors(): Promise<Sponsor[]> {
    return db.select().from(sponsors);
  }

  async createSponsor(sponsor: InsertSponsor): Promise<Sponsor> {
    const [created] = await db.insert(sponsors).values(sponsor).returning();
    return created;
  }

  async updateSponsor(id: string, sponsor: Partial<InsertSponsor>): Promise<Sponsor | undefined> {
    const [updated] = await db.update(sponsors).set(sponsor).where(eq(sponsors.id, id)).returning();
    return updated || undefined;
  }

  async deleteSponsor(id: string): Promise<boolean> {
    // Delete all related records first due to foreign key constraints
    await db.delete(sponsorUpdateRecipients).where(eq(sponsorUpdateRecipients.sponsorId, id));
    await db.delete(sponsorEmailEvents).where(eq(sponsorEmailEvents.sponsorId, id));
    await db.delete(episodeSponsors).where(eq(episodeSponsors.sponsorId, id));
    await db.delete(sponsorMilestones).where(eq(sponsorMilestones.sponsorId, id));
    await db.delete(sponsorViewMetrics).where(eq(sponsorViewMetrics.sponsorId, id));
    await db.delete(sponsorDeals).where(eq(sponsorDeals.sponsorId, id));
    // Set nullable foreign keys to null
    await db.update(episodeAdSlots).set({ sponsorId: null }).where(eq(episodeAdSlots.sponsorId, id));
    await db.update(projectSponsors).set({ sponsorId: null }).where(eq(projectSponsors.sponsorId, id));
    await db.update(emailNotifications).set({ sponsorId: null }).where(eq(emailNotifications.sponsorId, id));
    // Now delete the sponsor
    const result = await db.delete(sponsors).where(eq(sponsors.id, id)).returning();
    return result.length > 0;
  }

  async getEpisodeSponsors(episodeId: string): Promise<(EpisodeSponsor & { sponsor: Sponsor })[]> {
    const results = await db.select()
      .from(episodeSponsors)
      .innerJoin(sponsors, eq(episodeSponsors.sponsorId, sponsors.id))
      .where(eq(episodeSponsors.episodeId, episodeId));
    
    return results.map(r => ({ ...r.episode_sponsors, sponsor: r.sponsors }));
  }

  async getSponsorEpisodes(sponsorId: string): Promise<(EpisodeSponsor & { episode: Episode })[]> {
    const results = await db.select()
      .from(episodeSponsors)
      .innerJoin(episodes, eq(episodeSponsors.episodeId, episodes.id))
      .where(eq(episodeSponsors.sponsorId, sponsorId));
    
    return results.map(r => ({ ...r.episode_sponsors, episode: r.episodes }));
  }

  async addEpisodeSponsor(episodeSponsor: InsertEpisodeSponsor): Promise<EpisodeSponsor> {
    const [created] = await db.insert(episodeSponsors).values(episodeSponsor).returning();
    return created;
  }

  async removeEpisodeSponsor(id: string): Promise<boolean> {
    const result = await db.delete(episodeSponsors).where(eq(episodeSponsors.id, id)).returning();
    return result.length > 0;
  }

  async getSubscriber(id: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.id, id));
    return subscriber || undefined;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.email, email));
    return subscriber || undefined;
  }

  async getSubscribers(): Promise<Subscriber[]> {
    return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const [created] = await db.insert(subscribers).values(subscriber).returning();
    return created;
  }

  async updateSubscriber(id: string, subscriber: Partial<InsertSubscriber>): Promise<Subscriber | undefined> {
    const [updated] = await db.update(subscribers).set(subscriber).where(eq(subscribers.id, id)).returning();
    return updated || undefined;
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    const result = await db.delete(subscribers).where(eq(subscribers.id, id)).returning();
    return result.length > 0;
  }

  async getCommunityPhoto(id: string): Promise<CommunityPhoto | undefined> {
    const [photo] = await db.select().from(communityPhotos).where(eq(communityPhotos.id, id));
    return photo || undefined;
  }

  async getCommunityPhotos(status?: string): Promise<CommunityPhoto[]> {
    if (status) {
      return db.select().from(communityPhotos).where(eq(communityPhotos.status, status)).orderBy(desc(communityPhotos.createdAt));
    }
    return db.select().from(communityPhotos).orderBy(desc(communityPhotos.createdAt));
  }

  async createCommunityPhoto(photo: InsertCommunityPhoto): Promise<CommunityPhoto> {
    const [created] = await db.insert(communityPhotos).values(photo).returning();
    return created;
  }

  async updateCommunityPhoto(id: string, photo: Partial<InsertCommunityPhoto>): Promise<CommunityPhoto | undefined> {
    const [updated] = await db.update(communityPhotos).set(photo).where(eq(communityPhotos.id, id)).returning();
    return updated || undefined;
  }

  async deleteCommunityPhoto(id: string): Promise<boolean> {
    const result = await db.delete(communityPhotos).where(eq(communityPhotos.id, id)).returning();
    return result.length > 0;
  }

  async trackView(analytic: InsertViewAnalytic): Promise<ViewAnalytic> {
    const [created] = await db.insert(viewAnalytics).values(analytic).returning();
    return created;
  }

  async getEpisodeAnalytics(episodeId: string): Promise<{country: string, count: number}[]> {
    const results = await db.select({
      country: viewAnalytics.country,
      count: sql<number>`count(*)::int`
    })
    .from(viewAnalytics)
    .where(eq(viewAnalytics.episodeId, episodeId))
    .groupBy(viewAnalytics.country);
    
    return results.map(r => ({ country: r.country || 'Unknown', count: r.count }));
  }

  async getRecentViewsByEpisode(days: number = 7): Promise<{episodeId: string, recentViews: number}[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const results = await db.select({
      episodeId: viewAnalytics.episodeId,
      recentViews: sql<number>`count(*)::int`
    })
    .from(viewAnalytics)
    .where(sql`${viewAnalytics.viewedAt} >= ${cutoffDate}`)
    .groupBy(viewAnalytics.episodeId)
    .orderBy(sql`count(*) DESC`);
    
    return results.map(r => ({ episodeId: r.episodeId, recentViews: r.recentViews }));
  }

  async getSponsorMilestones(sponsorId: string): Promise<SponsorMilestone[]> {
    return db.select().from(sponsorMilestones).where(eq(sponsorMilestones.sponsorId, sponsorId));
  }

  async createSponsorMilestone(milestone: InsertSponsorMilestone): Promise<SponsorMilestone> {
    const [created] = await db.insert(sponsorMilestones).values(milestone).returning();
    return created;
  }

  async getMilestoneExists(sponsorId: string, episodeId: string, milestone: number): Promise<boolean> {
    const [existing] = await db.select().from(sponsorMilestones)
      .where(and(
        eq(sponsorMilestones.sponsorId, sponsorId),
        eq(sponsorMilestones.episodeId, episodeId),
        eq(sponsorMilestones.milestone, milestone)
      ));
    return !!existing;
  }

  // Sponsor Update Recipients
  async getSponsorUpdateRecipients(sponsorId: string): Promise<SponsorUpdateRecipient[]> {
    return db.select().from(sponsorUpdateRecipients)
      .where(eq(sponsorUpdateRecipients.sponsorId, sponsorId))
      .orderBy(desc(sponsorUpdateRecipients.createdAt));
  }

  async createSponsorUpdateRecipient(recipient: InsertSponsorUpdateRecipient): Promise<SponsorUpdateRecipient> {
    const [created] = await db.insert(sponsorUpdateRecipients).values(recipient).returning();
    return created;
  }

  async deleteSponsorUpdateRecipient(id: string): Promise<boolean> {
    const result = await db.delete(sponsorUpdateRecipients).where(eq(sponsorUpdateRecipients.id, id)).returning();
    return result.length > 0;
  }

  // Sponsor Email Events
  async getSponsorEmailEvents(sponsorId?: string): Promise<SponsorEmailEvent[]> {
    if (sponsorId) {
      return db.select().from(sponsorEmailEvents)
        .where(eq(sponsorEmailEvents.sponsorId, sponsorId))
        .orderBy(desc(sponsorEmailEvents.eventTimestamp));
    }
    return db.select().from(sponsorEmailEvents).orderBy(desc(sponsorEmailEvents.eventTimestamp));
  }

  async getSponsorEmailEventByToken(token: string): Promise<SponsorEmailEvent | undefined> {
    const [event] = await db.select().from(sponsorEmailEvents)
      .where(eq(sponsorEmailEvents.trackingToken, token));
    return event || undefined;
  }

  async createSponsorEmailEvent(event: InsertSponsorEmailEvent): Promise<SponsorEmailEvent> {
    const [created] = await db.insert(sponsorEmailEvents).values(event).returning();
    return created;
  }

  async updateSponsorEmailEvent(id: string, event: Partial<InsertSponsorEmailEvent>): Promise<SponsorEmailEvent | undefined> {
    const [updated] = await db.update(sponsorEmailEvents).set(event).where(eq(sponsorEmailEvents.id, id)).returning();
    return updated || undefined;
  }

  async getSponsorInquiry(id: string): Promise<SponsorInquiry | undefined> {
    const [inquiry] = await db.select().from(sponsorInquiries).where(eq(sponsorInquiries.id, id));
    return inquiry || undefined;
  }

  async getSponsorInquiries(): Promise<SponsorInquiry[]> {
    return db.select().from(sponsorInquiries).orderBy(desc(sponsorInquiries.createdAt));
  }

  async createSponsorInquiry(inquiry: InsertSponsorInquiry): Promise<SponsorInquiry> {
    const [created] = await db.insert(sponsorInquiries).values(inquiry).returning();
    return created;
  }

  async updateSponsorInquiry(id: string, inquiry: Partial<SponsorInquiry>): Promise<SponsorInquiry | undefined> {
    const [updated] = await db.update(sponsorInquiries).set(inquiry).where(eq(sponsorInquiries.id, id)).returning();
    return updated || undefined;
  }

  async getContactMessage(id: string): Promise<ContactMessage | undefined> {
    const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
    return message || undefined;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [created] = await db.insert(contactMessages).values(message).returning();
    return created;
  }

  async updateContactMessage(id: string, message: Partial<ContactMessage>): Promise<ContactMessage | undefined> {
    const [updated] = await db.update(contactMessages).set(message).where(eq(contactMessages.id, id)).returning();
    return updated || undefined;
  }

  async getHosts(): Promise<Host[]> {
    return db.select().from(hosts).orderBy(hosts.order);
  }

  async getHost(id: string): Promise<Host | undefined> {
    const [host] = await db.select().from(hosts).where(eq(hosts.id, id));
    return host || undefined;
  }

  async createHost(host: InsertHost): Promise<Host> {
    const [created] = await db.insert(hosts).values(host).returning();
    return created;
  }

  async updateHost(id: string, host: Partial<InsertHost>): Promise<Host | undefined> {
    const [updated] = await db.update(hosts).set(host).where(eq(hosts.id, id)).returning();
    return updated || undefined;
  }

  async deleteHost(id: string): Promise<boolean> {
    const result = await db.delete(hosts).where(eq(hosts.id, id)).returning();
    return result.length > 0;
  }

  async getGuests(): Promise<Guest[]> {
    return db.select().from(guests).orderBy(desc(guests.createdAt));
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const [guest] = await db.select().from(guests).where(eq(guests.id, id));
    return guest || undefined;
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const [created] = await db.insert(guests).values(guest).returning();
    return created;
  }

  async updateGuest(id: string, guest: Partial<InsertGuest>): Promise<Guest | undefined> {
    const [updated] = await db.update(guests).set(guest).where(eq(guests.id, id)).returning();
    return updated || undefined;
  }

  async deleteGuest(id: string): Promise<boolean> {
    const result = await db.delete(guests).where(eq(guests.id, id)).returning();
    return result.length > 0;
  }

  async getEpisodeComments(episodeId: string, status?: string): Promise<Comment[]> {
    if (status) {
      return db.select().from(comments)
        .where(and(eq(comments.episodeId, episodeId), eq(comments.status, status)))
        .orderBy(desc(comments.createdAt));
    }
    return db.select().from(comments).where(eq(comments.episodeId, episodeId)).orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  async updateComment(id: string, comment: Partial<InsertComment>): Promise<Comment | undefined> {
    const [updated] = await db.update(comments).set(comment).where(eq(comments.id, id)).returning();
    return updated || undefined;
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id)).returning();
    return result.length > 0;
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.email, email));
    return member || undefined;
  }

  async getMemberByStripeCustomerId(customerId: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.stripeCustomerId, customerId));
    return member || undefined;
  }

  async findDuplicateMembers(criteria: { email: string; name?: string; phone?: string }): Promise<{ field: string; member: Member } | null> {
    const emailMatch = await db.select().from(members).where(ilike(members.email, criteria.email)).limit(1);
    if (emailMatch.length > 0) return { field: "email", member: emailMatch[0] };

    if (criteria.phone) {
      const normalizedPhone = criteria.phone.replace(/\D/g, "");
      if (normalizedPhone.length >= 7) {
        const allMembers = await db.select().from(members).where(sql`regexp_replace(${members.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`).limit(1);
        if (allMembers.length > 0) return { field: "phone", member: allMembers[0] };
      }
    }

    if (criteria.name) {
      const normalizedName = criteria.name.trim();
      if (normalizedName.length >= 2) {
        const nameMatch = await db.select().from(members).where(ilike(members.name, normalizedName)).limit(1);
        if (nameMatch.length > 0) return { field: "name", member: nameMatch[0] };
      }
    }

    return null;
  }

  async getMembers(): Promise<Member[]> {
    return db.select().from(members).orderBy(desc(members.createdAt));
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [created] = await db.insert(members).values(member).returning();
    return created;
  }

  async updateMember(id: string, member: Partial<Member>): Promise<Member | undefined> {
    const [updated] = await db.update(members).set(member).where(eq(members.id, id)).returning();
    return updated || undefined;
  }

  async deleteMember(id: string): Promise<boolean> {
    const result = await db.delete(members).where(eq(members.id, id)).returning();
    return result.length > 0;
  }

  async getMemberByReplitId(replitId: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.replitId, replitId));
    return member || undefined;
  }

  async upsertMemberByReplitId(data: { replitId: string; email: string; name: string; profileImageUrl?: string }): Promise<Member> {
    let member = await this.getMemberByReplitId(data.replitId);
    if (member) {
      const [updated] = await db.update(members).set({
        email: data.email,
        name: data.name,
        profileImageUrl: data.profileImageUrl ?? member.profileImageUrl,
      }).where(eq(members.id, member.id)).returning();
      return updated;
    }
    member = await this.getMemberByEmail(data.email);
    if (member) {
      const [updated] = await db.update(members).set({
        replitId: data.replitId,
        profileImageUrl: data.profileImageUrl ?? member.profileImageUrl,
      }).where(eq(members.id, member.id)).returning();
      return updated;
    }
    const [newMember] = await db.insert(members).values({
      email: data.email,
      name: data.name,
      password: "",
      replitId: data.replitId,
      profileImageUrl: data.profileImageUrl,
    }).returning();
    return newMember;
  }

  async getSubscriptionHistory(memberId: string): Promise<SubscriptionHistory[]> {
    return db.select().from(subscriptionHistory).where(eq(subscriptionHistory.memberId, memberId)).orderBy(desc(subscriptionHistory.createdAt));
  }

  async createSubscriptionHistory(history: InsertSubscriptionHistory): Promise<SubscriptionHistory> {
    const [created] = await db.insert(subscriptionHistory).values(history).returning();
    return created;
  }

  async getPremiumEpisodes(): Promise<Episode[]> {
    return db.select().from(episodes)
      .where(and(eq(episodes.isPremium, true), eq(episodes.status, "published")))
      .orderBy(desc(episodes.publishedAt));
  }

  async getDiscussions(status?: string): Promise<Discussion[]> {
    if (status) {
      return db.select().from(discussions).where(eq(discussions.status, status)).orderBy(desc(discussions.createdAt));
    }
    return db.select().from(discussions).orderBy(desc(discussions.createdAt));
  }

  async getDiscussion(id: string): Promise<Discussion | undefined> {
    const [discussion] = await db.select().from(discussions).where(eq(discussions.id, id));
    return discussion || undefined;
  }

  async createDiscussion(discussion: InsertDiscussion): Promise<Discussion> {
    const [created] = await db.insert(discussions).values(discussion).returning();
    return created;
  }

  async updateDiscussion(id: string, discussion: Partial<Discussion>): Promise<Discussion | undefined> {
    const [updated] = await db.update(discussions).set(discussion).where(eq(discussions.id, id)).returning();
    return updated || undefined;
  }

  async deleteDiscussion(id: string): Promise<boolean> {
    const result = await db.delete(discussions).where(eq(discussions.id, id)).returning();
    return result.length > 0;
  }

  async getDiscussionReplies(discussionId: string): Promise<DiscussionReply[]> {
    return db.select().from(discussionReplies).where(eq(discussionReplies.discussionId, discussionId)).orderBy(discussionReplies.createdAt);
  }

  async createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply> {
    const [created] = await db.insert(discussionReplies).values(reply).returning();
    return created;
  }

  async deleteDiscussionReply(id: string): Promise<boolean> {
    const result = await db.delete(discussionReplies).where(eq(discussionReplies.id, id)).returning();
    return result.length > 0;
  }

  async getEmailNotifications(filters?: { type?: string; status?: string }): Promise<EmailNotification[]> {
    const conditions = [];
    if (filters?.type) conditions.push(eq(emailNotifications.type, filters.type));
    if (filters?.status) conditions.push(eq(emailNotifications.status, filters.status));
    
    if (conditions.length > 0) {
      return db.select().from(emailNotifications).where(and(...conditions)).orderBy(desc(emailNotifications.triggeredAt));
    }
    return db.select().from(emailNotifications).orderBy(desc(emailNotifications.triggeredAt));
  }

  async getEmailNotification(id: string): Promise<EmailNotification | undefined> {
    const [notification] = await db.select().from(emailNotifications).where(eq(emailNotifications.id, id));
    return notification || undefined;
  }

  async createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification> {
    const [created] = await db.insert(emailNotifications).values(notification).returning();
    return created;
  }

  async updateEmailNotification(id: string, notification: Partial<EmailNotification>): Promise<EmailNotification | undefined> {
    const [updated] = await db.update(emailNotifications).set(notification).where(eq(emailNotifications.id, id)).returning();
    return updated || undefined;
  }

  async getSponsorViewMetric(sponsorId: string): Promise<SponsorViewMetric | undefined> {
    const [metric] = await db.select().from(sponsorViewMetrics).where(eq(sponsorViewMetrics.sponsorId, sponsorId));
    return metric || undefined;
  }

  async getSponsorViewMetrics(): Promise<SponsorViewMetric[]> {
    return db.select().from(sponsorViewMetrics);
  }

  async createOrUpdateSponsorViewMetric(sponsorId: string, views: number): Promise<SponsorViewMetric> {
    const existing = await this.getSponsorViewMetric(sponsorId);
    if (existing) {
      const [updated] = await db.update(sponsorViewMetrics)
        .set({ totalViews: views, lastUpdated: new Date() })
        .where(eq(sponsorViewMetrics.sponsorId, sponsorId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(sponsorViewMetrics).values({ sponsorId, totalViews: views }).returning();
    return created;
  }

  async updateSponsorMilestone(sponsorId: string, milestone: number): Promise<void> {
    await db.update(sponsorViewMetrics)
      .set({ lastMilestone: milestone })
      .where(eq(sponsorViewMetrics.sponsorId, sponsorId));
  }

  async getMarketingSettings(): Promise<MarketingSettings> {
    const [settings] = await db.select().from(marketingSettings);
    if (settings) return settings;
    const [created] = await db.insert(marketingSettings).values({
      senderName: "Latest Talks",
      senderEmail: "hello@latesttalks.com",
      replyToEmail: "hello@latesttalks.com",
    }).returning();
    return created;
  }

  async updateMarketingSettings(settings: Partial<MarketingSettings>): Promise<MarketingSettings> {
    const existing = await this.getMarketingSettings();
    const [updated] = await db.update(marketingSettings)
      .set(settings)
      .where(eq(marketingSettings.id, existing.id))
      .returning();
    return updated;
  }

  async getActiveSubscribers(): Promise<Subscriber[]> {
    return db.select().from(subscribers).where(eq(subscribers.status, "active"));
  }

  // ============================================
  // ADMIN PORTAL - OPERATIONS MANAGEMENT
  // ============================================

  // Team Members
  async getTeamMembers(status?: string): Promise<TeamMember[]> {
    if (status) {
      return db.select().from(teamMembers).where(eq(teamMembers.status, status)).orderBy(teamMembers.name);
    }
    return db.select().from(teamMembers).orderBy(teamMembers.name);
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member || undefined;
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [created] = await db.insert(teamMembers).values(member).returning();
    return created;
  }

  async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const [updated] = await db.update(teamMembers).set(member).where(eq(teamMembers.id, id)).returning();
    return updated || undefined;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const result = await db.delete(teamMembers).where(eq(teamMembers.id, id)).returning();
    return result.length > 0;
  }

  // Guest Pipeline
  async getGuestPipeline(filters?: { status?: string; priority?: string }): Promise<GuestPipeline[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(guestPipeline.status, filters.status));
    if (filters?.priority) conditions.push(eq(guestPipeline.priority, filters.priority));
    
    if (conditions.length > 0) {
      return db.select().from(guestPipeline).where(and(...conditions)).orderBy(desc(guestPipeline.createdAt));
    }
    return db.select().from(guestPipeline).orderBy(desc(guestPipeline.createdAt));
  }

  async getGuestPipelineItem(id: string): Promise<GuestPipeline | undefined> {
    const [item] = await db.select().from(guestPipeline).where(eq(guestPipeline.id, id));
    return item || undefined;
  }

  async createGuestPipelineItem(item: InsertGuestPipeline): Promise<GuestPipeline> {
    const [created] = await db.insert(guestPipeline).values(item).returning();
    return created;
  }

  async updateGuestPipelineItem(id: string, item: Partial<InsertGuestPipeline>): Promise<GuestPipeline | undefined> {
    const [updated] = await db.update(guestPipeline).set(item).where(eq(guestPipeline.id, id)).returning();
    return updated || undefined;
  }

  async deleteGuestPipelineItem(id: string): Promise<boolean> {
    const result = await db.delete(guestPipeline).where(eq(guestPipeline.id, id)).returning();
    return result.length > 0;
  }

  // Episode Ad Slots
  async getEpisodeAdSlots(episodeId: string): Promise<EpisodeAdSlot[]> {
    return db.select().from(episodeAdSlots).where(eq(episodeAdSlots.episodeId, episodeId)).orderBy(episodeAdSlots.slotType, episodeAdSlots.slotIndex);
  }

  async createEpisodeAdSlot(slot: InsertEpisodeAdSlot): Promise<EpisodeAdSlot> {
    const [created] = await db.insert(episodeAdSlots).values(slot).returning();
    return created;
  }

  async updateEpisodeAdSlot(id: string, slot: Partial<InsertEpisodeAdSlot>): Promise<EpisodeAdSlot | undefined> {
    const [updated] = await db.update(episodeAdSlots).set(slot).where(eq(episodeAdSlots.id, id)).returning();
    return updated || undefined;
  }

  async deleteEpisodeAdSlot(id: string): Promise<boolean> {
    const result = await db.delete(episodeAdSlots).where(eq(episodeAdSlots.id, id)).returning();
    return result.length > 0;
  }

  // Episode Costs
  async getEpisodeCosts(episodeId: string): Promise<EpisodeCost[]> {
    return db.select().from(episodeCosts).where(eq(episodeCosts.episodeId, episodeId));
  }

  async createEpisodeCost(cost: InsertEpisodeCost): Promise<EpisodeCost> {
    const [created] = await db.insert(episodeCosts).values(cost).returning();
    return created;
  }

  async updateEpisodeCost(id: string, cost: Partial<InsertEpisodeCost>): Promise<EpisodeCost | undefined> {
    const [updated] = await db.update(episodeCosts).set(cost).where(eq(episodeCosts.id, id)).returning();
    return updated || undefined;
  }

  async deleteEpisodeCost(id: string): Promise<boolean> {
    const result = await db.delete(episodeCosts).where(eq(episodeCosts.id, id)).returning();
    return result.length > 0;
  }

  // Episode Production
  async getEpisodeProduction(episodeId: string): Promise<EpisodeProduction | undefined> {
    const [production] = await db.select().from(episodeProduction).where(eq(episodeProduction.episodeId, episodeId));
    return production || undefined;
  }

  async createEpisodeProduction(production: InsertEpisodeProduction): Promise<EpisodeProduction> {
    const [created] = await db.insert(episodeProduction).values(production).returning();
    return created;
  }

  async updateEpisodeProduction(id: string, production: Partial<InsertEpisodeProduction>): Promise<EpisodeProduction | undefined> {
    const [updated] = await db.update(episodeProduction).set({ ...production, updatedAt: new Date() }).where(eq(episodeProduction.id, id)).returning();
    return updated || undefined;
  }

  async getAllEpisodeProductions(filters?: { status?: string }): Promise<EpisodeProduction[]> {
    if (filters?.status) {
      return db.select().from(episodeProduction).where(eq(episodeProduction.productionStatus, filters.status)).orderBy(desc(episodeProduction.updatedAt));
    }
    return db.select().from(episodeProduction).orderBy(desc(episodeProduction.updatedAt));
  }

  // Expenses
  async getExpenses(filters?: { category?: string; projectId?: string; episodeId?: string }): Promise<Expense[]> {
    const conditions = [];
    if (filters?.category) conditions.push(eq(expenses.category, filters.category));
    if (filters?.projectId) conditions.push(eq(expenses.projectId, filters.projectId));
    if (filters?.episodeId) conditions.push(eq(expenses.episodeId, filters.episodeId));
    
    if (conditions.length > 0) {
      return db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.incurredDate));
    }
    return db.select().from(expenses).orderBy(desc(expenses.incurredDate));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    return created;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return updated || undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  // Projects
  async getProjects(status?: string): Promise<Project[]> {
    if (status) {
      return db.select().from(projects).where(eq(projects.status, status)).orderBy(desc(projects.createdAt));
    }
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return updated || undefined;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // Project Sponsors
  async getProjectSponsors(projectId: string): Promise<ProjectSponsor[]> {
    return db.select().from(projectSponsors).where(eq(projectSponsors.projectId, projectId));
  }

  async createProjectSponsor(sponsor: InsertProjectSponsor): Promise<ProjectSponsor> {
    const [created] = await db.insert(projectSponsors).values(sponsor).returning();
    return created;
  }

  async updateProjectSponsor(id: string, sponsor: Partial<InsertProjectSponsor>): Promise<ProjectSponsor | undefined> {
    const [updated] = await db.update(projectSponsors).set(sponsor).where(eq(projectSponsors.id, id)).returning();
    return updated || undefined;
  }

  async deleteProjectSponsor(id: string): Promise<boolean> {
    const result = await db.delete(projectSponsors).where(eq(projectSponsors.id, id)).returning();
    return result.length > 0;
  }

  // Sponsor Deals
  async getSponsorDeals(sponsorId?: string): Promise<SponsorDeal[]> {
    if (sponsorId) {
      return db.select().from(sponsorDeals).where(eq(sponsorDeals.sponsorId, sponsorId)).orderBy(desc(sponsorDeals.createdAt));
    }
    return db.select().from(sponsorDeals).orderBy(desc(sponsorDeals.createdAt));
  }

  async getSponsorDeal(id: string): Promise<SponsorDeal | undefined> {
    const [deal] = await db.select().from(sponsorDeals).where(eq(sponsorDeals.id, id));
    return deal || undefined;
  }

  async createSponsorDeal(deal: InsertSponsorDeal): Promise<SponsorDeal> {
    const [created] = await db.insert(sponsorDeals).values(deal).returning();
    return created;
  }

  async updateSponsorDeal(id: string, deal: Partial<InsertSponsorDeal>): Promise<SponsorDeal | undefined> {
    const [updated] = await db.update(sponsorDeals).set(deal).where(eq(sponsorDeals.id, id)).returning();
    return updated || undefined;
  }

  async deleteSponsorDeal(id: string): Promise<boolean> {
    const result = await db.delete(sponsorDeals).where(eq(sponsorDeals.id, id)).returning();
    return result.length > 0;
  }

  // Monthly Financials
  async getMonthlyFinancials(year?: number): Promise<MonthlyFinancial[]> {
    if (year) {
      return db.select().from(monthlyFinancials).where(eq(monthlyFinancials.year, year)).orderBy(monthlyFinancials.month);
    }
    return db.select().from(monthlyFinancials).orderBy(desc(monthlyFinancials.year), monthlyFinancials.month);
  }

  async getMonthlyFinancial(year: number, month: number): Promise<MonthlyFinancial | undefined> {
    const [financial] = await db.select().from(monthlyFinancials).where(and(eq(monthlyFinancials.year, year), eq(monthlyFinancials.month, month)));
    return financial || undefined;
  }

  async createOrUpdateMonthlyFinancial(financial: InsertMonthlyFinancial): Promise<MonthlyFinancial> {
    const existing = await this.getMonthlyFinancial(financial.year, financial.month);
    if (existing) {
      const [updated] = await db.update(monthlyFinancials).set({ ...financial, updatedAt: new Date() }).where(eq(monthlyFinancials.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(monthlyFinancials).values(financial).returning();
    return created;
  }

  // Yearly Ad Income
  async getYearlyAdIncome(): Promise<YearlyAdIncome[]> {
    return db.select().from(yearlyAdIncome).orderBy(desc(yearlyAdIncome.year));
  }

  async createOrUpdateYearlyAdIncome(income: InsertYearlyAdIncome): Promise<YearlyAdIncome> {
    const [existing] = await db.select().from(yearlyAdIncome).where(eq(yearlyAdIncome.year, income.year));
    if (existing) {
      const [updated] = await db.update(yearlyAdIncome).set({ ...income, updatedAt: new Date() }).where(eq(yearlyAdIncome.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(yearlyAdIncome).values(income).returning();
    return created;
  }

  // Ad Slot Requests
  async getAdSlotRequest(id: string): Promise<AdSlotRequest | undefined> {
    const [request] = await db.select().from(adSlotRequests).where(eq(adSlotRequests.id, id));
    return request || undefined;
  }

  async getAdSlotRequests(status?: string): Promise<AdSlotRequest[]> {
    if (status) {
      return db.select().from(adSlotRequests).where(eq(adSlotRequests.status, status)).orderBy(desc(adSlotRequests.createdAt));
    }
    return db.select().from(adSlotRequests).orderBy(desc(adSlotRequests.createdAt));
  }

  async createAdSlotRequest(request: InsertAdSlotRequest): Promise<AdSlotRequest> {
    const [created] = await db.insert(adSlotRequests).values(request).returning();
    return created;
  }

  async updateAdSlotRequest(id: string, request: Partial<AdSlotRequest>): Promise<AdSlotRequest | undefined> {
    const [updated] = await db.update(adSlotRequests).set(request).where(eq(adSlotRequests.id, id)).returning();
    return updated || undefined;
  }

  async deleteAdSlotRequest(id: string): Promise<boolean> {
    const result = await db.delete(adSlotRequests).where(eq(adSlotRequests.id, id)).returning();
    return result.length > 0;
  }

  // Bug Reports
  async getBugReports(filters?: { status?: string; priority?: string }): Promise<BugReport[]> {
    if (filters?.status && filters?.priority) {
      return db.select().from(bugReports)
        .where(and(eq(bugReports.status, filters.status), eq(bugReports.priority, filters.priority)))
        .orderBy(desc(bugReports.createdAt));
    }
    if (filters?.status) {
      return db.select().from(bugReports).where(eq(bugReports.status, filters.status)).orderBy(desc(bugReports.createdAt));
    }
    if (filters?.priority) {
      return db.select().from(bugReports).where(eq(bugReports.priority, filters.priority)).orderBy(desc(bugReports.createdAt));
    }
    return db.select().from(bugReports).orderBy(desc(bugReports.createdAt));
  }

  async getBugReport(id: string): Promise<BugReport | undefined> {
    const [report] = await db.select().from(bugReports).where(eq(bugReports.id, id));
    return report || undefined;
  }

  async createBugReport(report: InsertBugReport): Promise<BugReport> {
    const [created] = await db.insert(bugReports).values(report).returning();
    return created;
  }

  async updateBugReport(id: string, report: Partial<BugReport>): Promise<BugReport | undefined> {
    const [updated] = await db.update(bugReports).set(report).where(eq(bugReports.id, id)).returning();
    return updated || undefined;
  }

  async deleteBugReport(id: string): Promise<boolean> {
    const result = await db.delete(bugReports).where(eq(bugReports.id, id)).returning();
    return result.length > 0;
  }

  async markAllBugReportsRead(): Promise<void> {
    await db.update(bugReports).set({ isRead: true }).where(eq(bugReports.isRead, false));
  }

  // Guest Applications
  async getGuestApplications(status?: string): Promise<GuestApplication[]> {
    if (status) {
      return db.select().from(guestApplications).where(eq(guestApplications.status, status)).orderBy(desc(guestApplications.createdAt));
    }
    return db.select().from(guestApplications).orderBy(desc(guestApplications.createdAt));
  }

  async getGuestApplication(id: string): Promise<GuestApplication | undefined> {
    const [application] = await db.select().from(guestApplications).where(eq(guestApplications.id, id));
    return application || undefined;
  }

  async createGuestApplication(application: InsertGuestApplication): Promise<GuestApplication> {
    const [created] = await db.insert(guestApplications).values(application).returning();
    return created;
  }

  async updateGuestApplication(id: string, application: Partial<GuestApplication>): Promise<GuestApplication | undefined> {
    const [updated] = await db.update(guestApplications).set(application).where(eq(guestApplications.id, id)).returning();
    return updated || undefined;
  }

  async deleteGuestApplication(id: string): Promise<boolean> {
    const result = await db.delete(guestApplications).where(eq(guestApplications.id, id)).returning();
    return result.length > 0;
  }

  // Upcoming Episode Info
  async getUpcomingEpisodeInfo(): Promise<UpcomingEpisodeInfo | undefined> {
    const [info] = await db.select().from(upcomingEpisodeInfo).limit(1);
    return info || undefined;
  }

  async createOrUpdateUpcomingEpisodeInfo(info: InsertUpcomingEpisodeInfo): Promise<UpcomingEpisodeInfo> {
    const existing = await this.getUpcomingEpisodeInfo();
    if (existing) {
      const [updated] = await db.update(upcomingEpisodeInfo)
        .set({ ...info, updatedAt: new Date() })
        .where(eq(upcomingEpisodeInfo.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(upcomingEpisodeInfo).values(info).returning();
      return created;
    }
  }

  async getPlatforms(): Promise<Platform[]> {
    return db.select().from(platforms).orderBy(desc(platforms.createdAt));
  }

  async getPlatform(id: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform || undefined;
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [created] = await db.insert(platforms).values(platform).returning();
    return created;
  }

  async updatePlatform(id: string, platform: Partial<InsertPlatform>): Promise<Platform | undefined> {
    const [updated] = await db.update(platforms).set(platform).where(eq(platforms.id, id)).returning();
    return updated || undefined;
  }

  async deletePlatform(id: string): Promise<boolean> {
    await db.delete(platformContacts).where(eq(platformContacts.platformId, id));
    await db.delete(platformUsers).where(eq(platformUsers.platformId, id));
    await db.delete(platformEpisodeLinks).where(eq(platformEpisodeLinks.platformId, id));
    await db.delete(episodePlatformKpis).where(eq(episodePlatformKpis.platformId, id));
    await db.delete(kpiHistory).where(eq(kpiHistory.platformId, id));
    const result = await db.delete(platforms).where(eq(platforms.id, id)).returning();
    return result.length > 0;
  }

  async getPlatformContacts(platformId: string): Promise<PlatformContact[]> {
    return db.select().from(platformContacts).where(eq(platformContacts.platformId, platformId));
  }

  async createPlatformContact(contact: InsertPlatformContact): Promise<PlatformContact> {
    const [created] = await db.insert(platformContacts).values(contact).returning();
    return created;
  }

  async deletePlatformContact(id: string): Promise<boolean> {
    const result = await db.delete(platformContacts).where(eq(platformContacts.id, id)).returning();
    return result.length > 0;
  }

  async getPlatformUsers(platformId: string): Promise<PlatformUser[]> {
    return db.select().from(platformUsers).where(eq(platformUsers.platformId, platformId));
  }

  async getPlatformUser(id: string): Promise<PlatformUser | undefined> {
    const [user] = await db.select().from(platformUsers).where(eq(platformUsers.id, id));
    return user || undefined;
  }

  async getPlatformUserByEmail(email: string): Promise<PlatformUser | undefined> {
    const [user] = await db.select().from(platformUsers).where(eq(platformUsers.email, email));
    return user || undefined;
  }

  async createPlatformUser(user: InsertPlatformUser): Promise<PlatformUser> {
    const [created] = await db.insert(platformUsers).values(user).returning();
    return created;
  }

  async updatePlatformUser(id: string, user: Partial<InsertPlatformUser>): Promise<PlatformUser | undefined> {
    const [updated] = await db.update(platformUsers).set(user).where(eq(platformUsers.id, id)).returning();
    return updated || undefined;
  }

  async deletePlatformUser(id: string): Promise<boolean> {
    const result = await db.delete(platformUsers).where(eq(platformUsers.id, id)).returning();
    return result.length > 0;
  }

  async getPlatformEpisodeLinks(platformId: string): Promise<PlatformEpisodeLink[]> {
    return db.select().from(platformEpisodeLinks).where(eq(platformEpisodeLinks.platformId, platformId));
  }

  async createPlatformEpisodeLink(link: InsertPlatformEpisodeLink): Promise<PlatformEpisodeLink> {
    const [created] = await db.insert(platformEpisodeLinks).values(link).returning();
    return created;
  }

  async deletePlatformEpisodeLink(id: string): Promise<boolean> {
    const result = await db.delete(platformEpisodeLinks).where(eq(platformEpisodeLinks.id, id)).returning();
    return result.length > 0;
  }

  async getEpisodeKpis(episodeId: string): Promise<EpisodePlatformKpi[]> {
    return db.select().from(episodePlatformKpis).where(eq(episodePlatformKpis.websiteEpisodeId, episodeId));
  }

  async getEpisodeKpisByPlatform(platformId: string): Promise<EpisodePlatformKpi[]> {
    return db.select().from(episodePlatformKpis).where(eq(episodePlatformKpis.platformId, platformId));
  }

  async getKpiByPlatformAndEpisode(platformId: string, episodeId: string): Promise<EpisodePlatformKpi | undefined> {
    const [kpi] = await db.select().from(episodePlatformKpis)
      .where(and(eq(episodePlatformKpis.platformId, platformId), eq(episodePlatformKpis.websiteEpisodeId, episodeId)));
    return kpi || undefined;
  }

  async upsertEpisodeKpi(kpi: InsertEpisodePlatformKpi): Promise<EpisodePlatformKpi> {
    const existing = await this.getKpiByPlatformAndEpisode(kpi.platformId, kpi.websiteEpisodeId);
    if (existing) {
      const [updated] = await db.update(episodePlatformKpis)
        .set({ ...kpi, lastUpdated: new Date() })
        .where(eq(episodePlatformKpis.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(episodePlatformKpis).values(kpi).returning();
      return created;
    }
  }

  async getKpiHistory(platformId: string, episodeId?: string): Promise<KpiHistory[]> {
    if (episodeId) {
      return db.select().from(kpiHistory)
        .where(and(eq(kpiHistory.platformId, platformId), eq(kpiHistory.websiteEpisodeId, episodeId)))
        .orderBy(desc(kpiHistory.timestamp));
    }
    return db.select().from(kpiHistory)
      .where(eq(kpiHistory.platformId, platformId))
      .orderBy(desc(kpiHistory.timestamp));
  }

  async createKpiHistoryEntry(entry: InsertKpiHistory): Promise<KpiHistory> {
    const [created] = await db.insert(kpiHistory).values(entry).returning();
    return created;
  }

  async getAdminSectionView(adminUserId: string, sectionKey: string): Promise<AdminSectionView | null> {
    const [row] = await db.select().from(adminSectionViews)
      .where(and(eq(adminSectionViews.adminUserId, adminUserId), eq(adminSectionViews.sectionKey, sectionKey)));
    return row || null;
  }

  async upsertAdminSectionView(adminUserId: string, sectionKey: string): Promise<AdminSectionView> {
    const existing = await this.getAdminSectionView(adminUserId, sectionKey);
    if (existing) {
      const [updated] = await db.update(adminSectionViews)
        .set({ lastViewedAt: new Date() })
        .where(eq(adminSectionViews.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(adminSectionViews)
      .values({ adminUserId, sectionKey, lastViewedAt: new Date() })
      .returning();
    return created;
  }

  async getAdminNotificationCounts(adminUserId: string): Promise<Record<string, number>> {
    const epoch = new Date(0);

    const getLastViewed = async (key: string): Promise<Date> => {
      const view = await this.getAdminSectionView(adminUserId, key);
      return view?.lastViewedAt || epoch;
    };

    const [commentsLv, messagesLv, guestAppsLv, membersLv, subscribersLv, whatsappLv, photosLv, bugsLv] = await Promise.all([
      getLastViewed("comments"),
      getLastViewed("messages"),
      getLastViewed("guest-applications"),
      getLastViewed("members"),
      getLastViewed("subscribers"),
      getLastViewed("whatsapp"),
      getLastViewed("photos"),
      getLastViewed("bug-reports"),
    ]);

    const [commentsCount] = await db.select({ count: count() }).from(comments)
      .where(and(eq(comments.status, "pending"), gt(comments.createdAt, commentsLv)));

    const [contactMsgCount] = await db.select({ count: count() }).from(contactMessages)
      .where(and(eq(contactMessages.status, "unread"), gt(contactMessages.createdAt, messagesLv)));
    const [inquiryCount] = await db.select({ count: count() }).from(sponsorInquiries)
      .where(and(eq(sponsorInquiries.status, "new"), gt(sponsorInquiries.createdAt, messagesLv)));

    const [guestAppsCount] = await db.select({ count: count() }).from(guestApplications)
      .where(and(eq(guestApplications.status, "pending"), gt(guestApplications.createdAt, guestAppsLv)));

    const [membersCount] = await db.select({ count: count() }).from(members)
      .where(and(eq(members.subscriptionStatus, "pending"), gt(members.createdAt, membersLv)));

    const [subscribersCount] = await db.select({ count: count() }).from(subscribers)
      .where(gt(subscribers.createdAt, subscribersLv));

    const [whatsappCount] = await db.select({ count: count() }).from(whatsappContacts)
      .where(gt(whatsappContacts.createdAt, whatsappLv));

    const [photosCount] = await db.select({ count: count() }).from(communityPhotos)
      .where(and(eq(communityPhotos.status, "pending"), gt(communityPhotos.createdAt, photosLv)));

    const [bugsCount] = await db.select({ count: count() }).from(bugReports)
      .where(and(eq(bugReports.isRead, false), gt(bugReports.createdAt, bugsLv)));

    return {
      comments: commentsCount?.count || 0,
      messages: (contactMsgCount?.count || 0) + (inquiryCount?.count || 0),
      "guest-applications": guestAppsCount?.count || 0,
      members: membersCount?.count || 0,
      subscribers: subscribersCount?.count || 0,
      whatsapp: whatsappCount?.count || 0,
      photos: photosCount?.count || 0,
      "bug-reports": bugsCount?.count || 0,
    };
  }

  async getSponsorPromoCodes(sponsorId: string): Promise<SponsorPromoCode[]> {
    return db.select().from(sponsorPromoCodes)
      .where(eq(sponsorPromoCodes.sponsorId, sponsorId))
      .orderBy(desc(sponsorPromoCodes.createdAt));
  }

  async createSponsorPromoCode(promoCode: InsertSponsorPromoCode): Promise<SponsorPromoCode> {
    const [created] = await db.insert(sponsorPromoCodes).values(promoCode).returning();
    return created;
  }

  async updateSponsorPromoCode(id: string, promoCode: Partial<InsertSponsorPromoCode>): Promise<SponsorPromoCode | undefined> {
    const [updated] = await db.update(sponsorPromoCodes).set(promoCode).where(eq(sponsorPromoCodes.id, id)).returning();
    return updated || undefined;
  }

  async deleteSponsorPromoCode(id: string): Promise<boolean> {
    const result = await db.delete(sponsorPromoCodes).where(eq(sponsorPromoCodes.id, id)).returning();
    return result.length > 0;
  }
}
