Warning: truncated output (original token count: 40455)
Total output lines: 4136

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEpisodeSchema, 
  insertSponsorSchema, 
  insertSubscriberSchema,
  insertCommunityPhotoSchema,
  insertSponsorInquirySchema,
  insertContactMessageSchema,
  insertHostSchema,
  insertGuestSchema,
  insertCommentSchema,
  insertUserSchema,
  insertEpisodeSponsorSchema,
  insertViewAnalyticSchema,
  insertMemberSchema,
  memberLoginSchema,
  insertDiscussionSchema,
  insertDiscussionReplySchema,
  insertEmailNotificationSchema,
  insertMarketingSettingsSchema,
  insertTeamMemberSchema,
  insertGuestPipelineSchema,
  insertEpisodeAdSlotSchema,
  insertEpisodeCostSchema,
  insertEpisodeProductionSchema,
  insertExpenseSchema,
  insertProjectSchema,
  insertProjectSponsorSchema,
  insertSponsorDealSchema,
  insertMonthlyFinancialSchema,
  insertYearlyAdIncomeSchema,
  insertAdSlotRequestSchema,
  insertBugReportSchema,
  insertGuestApplicationSchema,
  insertPlatformSchema,
  insertPlatformContactSchema,
  episodePlatformKpis,
} from "@shared/schema";
import { 
  emailService, 
  generateNewEpisodeEmail, 
  generateMilestoneEmail,
  generateGuestSchedulingEmail,
  generateGuestReminder1DayEmail,
  generateGuestReminder2HoursEmail,
  generateGoogleMapsLink
} from "./emailService";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { getVideoStatistics, isYouTubeConfigured } from "./youtubeService";
import { whatsappService } from "./whatsappService";
import { insertWhatsappContactSchema, insertWhatsappTemplateSchema } from "@shared/schema";
import { stripHtmlToText } from "@shared/textUtils";
import { db } from "./db";
import { eventTickets } from "@shared/schema";
import { desc, eq, sql } from "drizzle-orm";
import { EVENT, sendTicketEmails } from "./eventTickets";

// Token-based auth for webview cookie issues
// Stores valid tokens mapped to userId (cleared on restart, just like sessions)
const validAdminTokens = new Map<string, string>();

const generateAdminToken = (userId: string): string => {
  const token = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  validAdminTokens.set(token, userId);
  return token;
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check for admin token in header (fallback for webview cookie issues)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const tokenUserId = validAdminTokens.get(token);
    if (tokenUserId) {
      if (!req.session.userId) {
        req.session.userId = tokenUserId;
        req.session.userRole = "admin";
      }
      return next();
    }
  }
  
  // Check session-based auth
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Unauthorized - Please log in" });
  }
  if (req.session.userRole !== "admin") {
    return res.status(403).json({ error: "Forbidden - Admin access required" });
  }
  next();
};

const requireMember = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.memberId) {
    return res.status(401).json({ error: "Unauthorized - Please log in as a member" });
  }
  next();
};

const requireActiveMember = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.memberId) {
    return res.status(401).json({ error: "Unauthorized - Please log in as a member" });
  }
  const member = await storage.getMember(req.session.memberId);
  if (!member || member.subscriptionStatus !== "active") {
    return res.status(403).json({ error: "Active subscription required" });
  }
  next();
};

// Initialize Stripe (will use key from environment when available)
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-04-30.basil" as any });
};

// In-memory cache for resolved subscription price IDs
let _cachedMonthlyPriceId: string | null = null;
let _cachedYearlyPriceId: string | null = null;

/**
 * Resolves the Latest Talks+ subscription price IDs.
 * Priority: env vars → look up existing Stripe prices → create prices.
 * Returns { monthlyPriceId, yearlyPriceId } or throws with a friendly message.
 */
async function resolveSubscriptionPrices(): Promise<{ monthlyPriceId: string; yearlyPriceId: string }> {
  // Return from cache if already resolved
  if (_cachedMonthlyPriceId && _cachedYearlyPriceId) {
    return { monthlyPriceId: _cachedMonthlyPriceId, yearlyPriceId: _cachedYearlyPriceId };
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Payment system not configured. Please contact support.");
  }

  // Env vars take priority
  let monthlyPriceId = process.env.STRIPE_PRICE_ID || null;
  let yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID || null;

  if (monthlyPriceId && yearlyPriceId) {
    _cachedMonthlyPriceId = monthlyPriceId;
    _cachedYearlyPriceId = yearlyPriceId;
    return { monthlyPriceId, yearlyPriceId };
  }

  // Look up the Latest Talks+ product
  const products = await stripe.products.list({ limit: 20 });
  let subscriptionProduct = products.data.find(p => p.name === "Latest Talks+" && p.active);

  if (!subscriptionProduct) {
    subscriptionProduct = await stripe.products.create({
      name: "Latest Talks+",
      description: "Premium membership with exclusive content, early access, and ad-free experience",
      metadata: { app: "latest-talks", type: "subscription" },
    });
  }

  const subPrices = await stripe.prices.list({ product: subscriptionProduct.id, active: true });

  // Resolve monthly ($9.99/month)
  if (!monthlyPriceId) {
    let monthlyPrice = subPrices.data.find(p => p.recurring?.interval === "month" && p.unit_amount === 999);
    if (!monthlyPrice) {
      monthlyPrice = await stripe.prices.create({
        product: subscriptionProduct.id,
        unit_amount: 999,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { plan: "monthly" },
      });
    }
    monthlyPriceId = monthlyPrice.id;
  }

  // Resolve yearly ($119.99/year)
  if (!yearlyPriceId) {
    let yearlyPrice = subPrices.data.find(p => p.recurring?.interval === "year" && p.unit_amount === 11999);
    if (!yearlyPrice) {
      yearlyPrice = await stripe.prices.create({
        product: subscriptionProduct.id,
        unit_amount: 11999,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { plan: "annual" },
      });
    }
    yearlyPriceId = yearlyPrice.id;
  }

  console.log(`[Stripe] Resolved subscription prices — monthly: ${monthlyPriceId}, yearly: ${yearlyPriceId}`);
  _cachedMonthlyPriceId = monthlyPriceId;
  _cachedYearlyPriceId = yearlyPriceId;
  return { monthlyPriceId, yearlyPriceId };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/events/live/status", async (_req, res) => {
    const [row] = await db.select({ sold: sql<number>`coalesce(sum(${eventTickets.quantity}), 0)::int` }).from(eventTickets).where(sql`${eventTickets.paymentStatus} = 'paid'`);
    const sold = Number(row?.sold || 0);
    res.json({ ...EVENT, sold, remaining: Math.max(0, EVENT.capacity - sold) });
  });

  app.get("/api/admin/event-tickets", requireAdmin, async (_req, res) => {
    const tickets = await db.select().from(eventTickets).orderBy(desc(eventTickets.createdAt));
    const sold = tickets.filter(t => t.paymentStatus === "paid").reduce((sum, t) => sum + t.quantity, 0);
    const revenueCents = tickets.filter(t => t.paymentStatus === "paid").reduce((sum, t) => sum + t.amountCents, 0);
    res.json({ tickets, totals: { orders: tickets.length, sold, revenueCents, remaining: Math.max(0, EVENT.capacity - sold) } });
  });

  app.patch("/api/admin/event-tickets/:id/check-in", requireAdmin, async (req, res) => {
    const count = Number(req.body?.checkedInCount);
    const [current] = await db.select().from(eventTickets).where(eq(eventTickets.id, req.params.id));
    if (!current) return res.status(404).json({ error: "Ticket order not found." });
    if (!Number.isInteger(count) || count < 0 || count > current.quantity) return res.status(400).json({ error: `Check-in must be between 0 and ${current.quantity}.` });
    const [updated] = await db.update(eventTickets).set({ checkedInCount: count }).where(eq(eventTickets.id, current.id)).returning();
    res.json(updated);
  });

  app.post("/api/admin/event-tickets/:id/resend", requireAdmin, async (req, res) => {
    const [ticket] = await db.select().from(eventTickets).where(eq(eventTickets.id, req.params.id));
    if (!ticket) return res.status(404).json({ error: "Ticket order not found." });
    try {
      const messageId = await sendTicketEmails(ticket);
      return res.json({ success: true, messageId });
    } catch (error) {
      console.error("Ticket resend failed", error);
      return res.status(502).json({ error: error instanceof Error ? error.message : "Ticket email could not be sent." });
    }
  });

  app.post("/api/events/live/purchase", async (req, res) => {
    const { name, email, phone, quantity, cardToken, cvvToken, expiration, billingZip } = req.body || {};
    const qty = Number(quantity);
    if (typeof name !== "string" || name.trim().length < 2 || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Please enter a valid name and email address." });
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ error: "Choose between 1 and 10 tickets." });
    if (typeof cardToken !== "string" || !cardToken || typeof cvvToken !== "string" || !cvvToken) return res.status(400).json({ error: "Enter your card information again." });
    if (typeof expiration !== "string" || !/^\d{4}$/.test(expiration) || typeof billingZip !== "string" || !/^\d{5}(-\d{4})?$/.test(billingZip)) return res.status(400).json({ error: "Enter a valid expiration date and billing ZIP code." });
    const solaKey = process.env.SOLA_API_KEY;
    if (!solaKey) return res.status(503).json({ error: "Ticket checkout is temporarily unavailable." });

    try {
      const [inventory] = await db.select({ sold: sql<number>`coalesce(sum(${eventTickets.quantity}), 0)::int` }).from(eventTickets).where(sql`${eventTickets.paymentStatus} = 'paid'`);
      if (Number(inventory?.sold || 0) + qty > EVENT.capacity) return res.status(409).json({ error: "There are not enough tickets remaining for this order." });
      const orderNumber = `LT-EVT-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const ticketCode = `LTE-${crypto.randomUUID().replace(/-/g, "").slice(0, 14).toUpperCase()}`;
      const amountCents = EVENT.priceCents * qty;
      const gatewayResponse = await fetch("https://x1.cardknox.com/gatewayjson", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xKey: solaKey, xVersion: "5.0.0", xSoftwareName: process.env.SOLA_SOFTWARE_NAME || "Latest Talks", xSoftwareVersion: process.env.SOLA_SOFTWARE_VERSION || "1.0.0", xCommand: "cc:sale", xAmount: (amountCents / 100).toFixed(2), xCardNum: cardToken, xCVV: cvvToken, xExp: expiration, xZip: billingZip, xName: name.trim(), xEmail: email.trim().toLowerCase(), xInvoice: orderNumber, xDescription: `${qty} ticket(s) — ${EVENT.name}`, xCurrency: "USD", xRecurringIndicator: "Single", xIP: req.ip }),
      });
      const gateway = await gatewayResponse.json() as Record<string, string>;
      if (!gatewayResponse.ok || gateway.xResult !== "A" || Math.round(Number(gateway.xAuthAmount) * 100) !== amountCents) return res.status(402).json({ error: gateway.xError || "The payment was not approved. Please try again with fresh card details." });
      const [ticket] = await db.insert(eventTickets).values({ orderNumber, ticketCode, buyerName: name.trim(), buyerEmail: email.trim().toLowerCase(), buyerPhone: typeof phone === "string" ? phone.trim() : null, quantity: qty, amountCents, solaReferenceNumber: gateway.xRefNum, solaAuthorizationCode: gateway.xAuthCode, maskedCardNumber: gateway.xMaskedCardNumber, cardType: gateway.xCardType }).returning();
      let emailSent = false;
      let emailError: string | undefined;
      try {
        await sendTicketEmails(ticket);
        emailSent = true;
      } catch (error) {
        console.error("Ticket email delivery failed", error);
        emailError = error instanceof Error ? error.message : "Ticket email could not be sent.";
      }
      return res.status(201).json({ success: true, orderNumber, ticketCode, quantity: qty, amountCents, emailSent, emailError });
    } catch (error) {
      console.error("Event ticket purchase failed", error);
      return res.status(500).json({ error: "We could not complete the purchase. Please contact Hello@latesttalks.com before trying again." });
    }
  });
  
  // ============ EPISODES ============
  app.get("/api/episodes", async (req, res) => {
    const { status, category, type } = req.query;
    const episodes = await storage.getEpisodesWithGuests({
      status: status as string,
      category: category as string,
      type: type as string,
    });
    
    // Compute automatic labels
    const recentViews = await storage.getRecentViewsByEpisode(7);
    const recentViewsMap = new Map(recentViews.map(r => [r.episodeId, r.recentViews]));
    
    // Calculate thresholds for auto-labels
    const now = new Date();
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    // Get top trending (top 3 by recent views with minimum threshold)
    const trendingThreshold = 10; // Minimum views in 7 days to be trending
    const sortedByRecent = [...episodes]
      .filter(e => e.status === "published" && (recentViewsMap.get(e.id) || 0) >= trendingThreshold)
      .sort((a, b) => (recentViewsMap.get(b.id) || 0) - (recentViewsMap.get(a.id) || 0))
      .slice(0, 3)
      .map(e => e.id);
    
    // Get top most popular (top 3 by total views with minimum threshold)
    const popularThreshold = 100; // Minimum total views to be most popular
    const sortedByTotal = [...episodes]
      .filter(e => e.status === "published" && (e.viewCount || 0) >= popularThreshold)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 3)
      .map(e => e.id);
    
    // Get all episode-sponsor links and sponsors to check for prime sponsors
    const allSponsors = await storage.getSponsors();
    const primeSponsorIds = new Set(allSponsors.filter(s => s.isPrime).map(s => s.id));
    
    // Get prime sponsor info for each episode
    const episodePrimeStatusMap = new Map<string, boolean>();
    for (const episode of episodes) {
      const episodeSponsors = await storage.getEpisodeSponsors(episode.id);
      const hasPrime = episodeSponsors.some(es => primeSponsorIds.has(es.sponsorId));
      episodePrimeStatusMap.set(episode.id, hasPrime);
    }
    
    // Add computed labels to episodes
    const episodesWithLabels = episodes.map(episode => {
      let computedLabel: string | null = null;
      
      // Priority: New Release > Trending Now > Most Popular
      // Check if new release (published within 14 days)
      if (episode.publishedAt && new Date(episode.publishedAt) >= fourteenDaysAgo && episode.status === "published") {
        computedLabel = "New Release";
      }
      // Check if trending (but not if already new release)
      else if (sortedByRecent.includes(episode.id)) {
        computedLabel = "Trending Now";
      }
      // Check if most popular (but not if already trending)
      else if (sortedByTotal.includes(episode.id) && !sortedByRecent.includes(episode.id)) {
        computedLabel = "Most Popular";
      }
      
      return {
        ...episode,
        computedLabel,
        recentViews: recentViewsMap.get(episode.id) || 0,
        hasPrimeSponsor: episodePrimeStatusMap.get(episode.id) || false,
      };
    });
    
    res.json(episodesWithLabels);
  });

  app.get("/api/episodes/:id", async (req, res) => {
    const episode = await storage.getEpisodeWithGuests(req.params.id);
    if (!episode) return res.status(404).json({ error: "Episode not found" });
    res.json(episode);
  });

  app.post("/api/episodes", requireAdmin, async (req, res) => {
    const parsed = insertEpisodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const episode = await storage.createEpisode(parsed.data);
    res.status(201).json(episode);
  });

  app.patch("/api/episodes/:id", requireAdmin, async (req, res) => {
    const episode = await storage.updateEpisode(req.params.id, req.body);
    if (!episode) return res.status(404).json({ error: "Episode not found" });
    res.json(episode);
  });

  app.delete("/api/episodes/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteEpisode(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Episode not found" });
    res.status(204).send();
  });

  app.get("/api/episodes/:id/sponsors", async (req, res) => {
    const sponsors = await storage.getEpisodeSponsors(req.params.id);
    res.json(sponsors);
  });

  app.get("/api/episodes/:id/comments", async (req, res) => {
    const status = req.query.status as string;
    const comments = await storage.getEpisodeComments(req.params.id, status);
    res.json(comments);
  });

  app.post("/api/episodes/:id/comments", async (req, res) => {
    const parsed = insertCommentSchema.safeParse({ ...req.body, episodeId: req.params.id });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const comment = await storage.createComment(parsed.data);
    res.status(201).json(comment);
  });

  // Track views
  app.post("/api/episodes/:id/view", async (req, res) => {
    const parsed = insertViewAnalyticSchema.safeParse({ 
      episodeId: req.params.id,
      country: req.body.country,
      city: req.body.city,
    });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    await storage.trackView(parsed.data);
    res.status(201).json({ success: true });
  });

  // ============ YOUTUBE METADATA ============
  app.post("/api/youtube/metadata", requireAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "YouTube URL is required" });
      }

      // Extract video ID from URL
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
      if (!videoIdMatch) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }
      const videoId = videoIdMatch[1];

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        // Fetch oEmbed data (title, author, thumbnail)
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedResponse = await fetch(oembedUrl, { signal: controller.signal });
        
        if (!oembedResponse.ok) {
          clearTimeout(timeout);
          return res.status(404).json({ error: "Video not found or is private" });
        }
        
        const oembedData = await oembedResponse.json();

        // Fetch the video page to scrape description (with separate timeout)
        let description = "";
        try {
          const pageController = new AbortController();
          const pageTimeout = setTimeout(() => pageController.abort(), 8000);
          
          const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { 
            signal: pageController.signal 
          });
          clearTimeout(pageTimeout);
          const pageHtml = await pageResponse.text();
          
          // Extract description from meta tag
          const descMatch = pageHtml.match(/<meta name="description" content="([^"]*)">/);
          if (descMatch) {
            let rawDesc = descMatch[1]
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
            
            // Filter out generic YouTube descriptions
            const genericDescriptions = [
              "Enjoy the videos and music you love",
              "Share your videos with friends, family, and the world",
            ];
            
            const isGeneric = genericDescriptions.some(generic => 
              rawDesc.toLowerCase().includes(generic.toLowerCase())
            );
            
            if (!isGeneric) {
              description = rawDesc;
            }
          }
          
          // Try to extract from JSON-LD if available
          const jsonLdMatch = pageHtml.match(/<script type="application\/ld\+json"[^>]*>({[^<]+})<\/script>/);
          if (jsonLdMatch) {
            try {
              const jsonLd = JSON.parse(jsonLdMatch[1]);
              if (jsonLd.description) {
                description = jsonLd.description;
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        } catch (e) {
          // If scraping fails, continue with empty description
          console.log("Could not fetch video description:", e);
        }

        // Strip any HTML markup from the scraped description
        description = stripHtmlToText(description);

        clearTimeout(timeout);

        // Extract episode number from title if present
        let episodeNumber: number | null = null;
        const titleMatch = oembedData.title.match(/#(\d+)/);
        if (titleMatch) {
          episodeNumber = parseInt(titleMatch[1], 10);
        }

        // Clean up title (remove "Latest Talks #XX |" prefix if present)
        let cleanTitle = oembedData.title;
        const prefixMatch = cleanTitle.match(/^Latest Talks\s*#\d+\s*\|\s*/i);
        if (prefixMatch) {
          cleanTitle = cleanTitle.substring(prefixMatch[0].length);
        }

        // Try to extract guest name from title or description
        let guestName: string | null = null;
        
        // Common patterns in titles: "Interview with John Smith", "Conversation with...", 
        // "John Smith - Topic", "Topic | John Smith", "Topic featuring John Smith"
        const titleGuestPatterns = [
          /(?:interview|conversation|chat|talk|speaking)\s+with\s+([^|–\-]+)/i,
          /featuring\s+([^|–\-]+)/i,
          /\|\s*([^|–\-]+?)\s*$/i,  // Name at end after pipe
          /–\s*([^–]+?)\s*$/i,  // Name at end after dash
          /-\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/,  // Name at end (capitalized words)
        ];
        
        for (const pattern of titleGuestPatterns) {
          const match = cleanTitle.match(pattern);
          if (match && match[1]) {
            const potentialName = match[1].trim();
            // Validate it looks like a name (has at least 2 words, not too long)
            if (potentialName.split(/\s+/).length >= 2 && potentialName.length < 50) {
              guestName = potentialName;
              break;
            }
          }
        }
        
        // If no guest found in title, try description
        if (!guestName && description) {
          const descGuestPatterns = [
            /(?:guest|featuring|with)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
            /interview(?:ing|ed)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
          ];
          
          for (const pattern of descGuestPatterns) {
            const match = description.match(pattern);
            if (match && match[1]) {
              const potentialName = match[1].trim();
              if (potentialName.split(/\s+/).length >= 2 && potentialName.length < 50) {
                guestName = potentialName;
                break;
              }
            }
          }
        }

        res.json({
          videoId,
          title: cleanTitle,
          fullTitle: oembedData.title,
          description,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          channelName: oembedData.author_name,
          episodeNumber,
          guestName,
        });
      } catch (fetchError: any) {
        clearTimeout(timeout);
        if (fetchError.name === 'AbortError') {
          return res.status(504).json({ error: "Request timed out - YouTube is slow to respond" });
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error fetching YouTube metadata:", error);
      res.status(500).json({ error: "Failed to fetch video metadata" });
    }
  });

  app.get("/api/episodes/:id/analytics", async (req, res) => {
    const analytics = await storage.getEpisodeAnalytics(req.params.id);
    res.json(analytics);
  });

  // ============ SPONSORS ============
  app.get("/api/sponsors", async (req, res) => {
    const sponsors = await storage.getSponsors();
    res.json(sponsors);
  });

  app.get("/api/sponsors/:id", async (req, res) => {
    const sponsor = await storage.getSponsor(req.params.id);
    if (!sponsor) return res.status(404).json({ error: "Sponsor not found" });
    res.json(sponsor);
  });

  app.post("/api/sponsors", requireAdmin, async (req, res) => {
    const parsed = insertSponsorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const sponsor = await storage.createSponsor(parsed.data);
    res.status(201).json(sponsor);
  });

  app.patch("/api/sponsors/:id", requireAdmin, async (req, res) => {
    const data = { ...req.body };
    if ("promoCodeExpiration" in data) {
      data.promoCodeExpiration = data.promoCodeExpiration ? new Date(data.promoCodeExpiration) : null;
    }
    if ("contractEndDate" in data) {
      data.contractEndDate = data.contractEndDate ? new Date(data.contractEndDate) : null;
    }
    const sponsor = await storage.updateSponsor(req.params.id, data);
    if (!sponsor) return res.status(404).json({ error: "Sponsor not found" });
    res.json(sponsor);
  });

  app.get("/api/sponsors/:id/promo-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getSponsorPromoCodes(req.params.id);
      res.json(codes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sponsors/:id/promo-codes", requireAdmin, async (req, res) => {
    try {
      const data = { ...req.body, sponsorId: req.params.id };
      data.expiration = data.expiration ? new Date(data.expiration) : null;
      const code = await storage.createSponsorPromoCode(data);
      res.status(201).json(code);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/sponsor-promo-codes/:id", requireAdmin, async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.expiration) data.expiration = new Date(data.expiration);
      const code = await storage.updateSponsorPromoCode(req.params.id, data);
      if (!code) return res.status(404).json({ error: "Promo code not found" });
      res.json(code);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/sponsor-promo-codes/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteSponsorPromoCode(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Promo code not found" });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/sponsors/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteSponsor(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Sponsor not found" });
    res.status(204).send();
  });

  app.put("/api/sponsors/:id/logo", requireAdmin, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      // Normalize path and set ACL to public so logo is accessible
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        { visibility: "public", owner: "system" }
      );
      
      const sponsor = await storage.updateSponsor(req.params.id, { logoUrl: objectPath });
      if (!sponsor) return res.status(404).json({ error: "Sponsor not found" });
      
      res.json(sponsor);
    } catch (error) {
      console.error("Error processing sponsor logo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/sponsors/:id/logo", requireAdmin, async (req, res) => {
    try {
      const sponsor = await storage.updateSponsor(req.params.id, { logoUrl: null });
      if (!sponsor) return res.status(404).json({ error: "Sponsor not found" });
      res.json(sponsor);
    } catch (error) {
      console.error("Error removing sponsor logo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/sponsors/:id/episodes", async (req, res) => {
    const episodes = await storage.getSponsorEpisodes(req.params.id);
    res.json(episodes);
  });

  app.get("/api/sponsors/:id/milestones", async (req, res) => {
    const milestones = await storage.getSponsorMilestones(req.params.id);
    res.json(milestones);
  });

  // ============ SPONSOR UPDATE RECIPIENTS ============
  app.get("/api/sponsors/:id/update-recipients", requireAdmin, async (req, res) => {
    const recipients = await storage.getSponsorUpdateRecipients(req.params.id);
    res.json(recipients);
  });

  app.post("/api/sponsors/:id/update-recipients", requireAdmin, async (req, res) => {
    const { email, label } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const recipient = await storage.createSponsorUpdateRecipient({
      sponsorId: req.params.id,
      email,
      label: label || null,
    });
    res.status(201).json(recipient);
  });

  app.delete("/api/sponsor-update-recipients/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteSponsorUpdateRecipient(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Recipient not found" });
    res.status(204).send();
  });

  // ============ SPONSOR EMAIL EVENTS ============
  app.get("/api/sponsor-email-events", requireAdmin, async (req, res) => {
    const sponsorId = req.query.sponsorId as string | undefined;
    const events = await storage.getSponsorEmailEvents(sponsorId);
    res.json(events);
  });

  app.post("/api/sponsor-email-events", requireAdmin, async (req, res) => {
    const event = await storage.createSponsorEmailEvent(req.body);
    res.status(201).json(event);
  });

  // Email open tracking pixel endpoint (public, no auth required)
  app.get("/api/track/email-open/:token", async (req, res) => {
    const { token } = req.params;
    try {
      const event = await storage.getSponsorEmailEventByToken(token);
      if (event && event.eventType === 'sent') {
        await storage.updateSponsorEmailEvent(event.id, { eventType: 'opened' });
      }
    } catch (error) {
      console.error("Error tracking email open:", error);
    }
    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.send(pixel);
  });

  // ============ EPISODE SPONSORS ============
  app.post("/api/episode-sponsors", requireAdmin, async (req, res) => {
    const parsed = insertEpisodeSponsorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const epSponsor = await storage.addEpisodeSponsor(parsed.data);
    res.status(201).json(epSponsor);
  });

  app.delete("/api/episode-sponsors/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.removeEpisodeSponsor(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Episode sponsor not found" });
    res.status(204).send();
  });

  // ============ SUBSCRIBERS ============
  app.get("/api/subscribers", async (req, res) => {
    const subscribers = await storage.getSubscribers();
    res.json(subscribers);
  });

  app.post("/api/subscribers", async (req, res) => {
    const parsed = insertSubscriberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    
    // Check if already subscribed
    const existing = await storage.getSubscriberByEmail(parsed.data.email);
    if (existing) {
      if (existing.status === "unsubscribed") {
        const updated = await storage.updateSubscriber(existing.id, { status: "active" });
        return res.json(updated);
      }
      return res.status(400).json({ error: "Already subscribed" });
    }
    
    const subscriber = await storage.createSubscriber(parsed.data);
    res.status(201).json(subscriber);
  });

  app.patch("/api/subscribers/:id", requireAdmin, async (req, res) => {
    const subscriber = await storage.updateSubscriber(req.params.id, req.body);
    if (!subscriber) return res.status(404).json({ error: "Subscriber not found" });
    res.json(subscriber);
  });

  app.delete("/api/subscribers/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteSubscriber(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Subscriber not found" });
    res.status(204).send();
  });

  // Batch import subscribers (admin only)
  app.post("/api/subscribers/batch-import", requireAdmin, async (req, res) => {
    const { subscribers } = req.body;
    if (!Array.isArray(subscribers)) {
      return res.status(400).json({ error: "subscribers must be an array" });
    }
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    for (const sub of subscribers) {
      if (!sub.email || typeof sub.email !== "string") {
        errors.push(`Invalid entry: ${JSON.stringify(sub)}`);
        continue;
      }
      
      const email = sub.email.toLowerCase().trim();
      if (!email || !email.includes("@")) {
        errors.push(`Invalid email: ${email}`);
        continue;
      }
      
      try {
        const existing = await storage.getSubscriberByEmail(email);
        if (existing) {
          skipped++;
          continue;
        }
        
        await storage.createSubscriber({
          email,
          name: sub.name || null,
          status: "active",
          source: "imported"
        });
        imported++;
      } catch (e) {
        errors.push(`Error importing ${email}: ${(e as Error).message}`);
      }
    }
    
    res.json({ 
      success: true, 
      imported, 
      skipped, 
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      total: subscribers.length 
    });
  });

  // ============ COMMUNITY PHOTOS ============
  app.get("/api/community-photos", async (req, res) => {
    const status = req.query.status as string;
    const photos = await storage.getCommunityPhotos(status);
    res.json(photos);
  });

  app.post("/api/community-photos", async (req, res) => {
    const parsed = insertCommunityPhotoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const photo = await storage.createCommunityPhoto(parsed.data);
    res.status(201).json(photo);
  });

  app.patch("/api/community-photos/:id", requireAdmin, async (req, res) => {
    const photo = await storage.updateCommunityPhoto(req.params.id, req.body);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    res.json(photo);
  });

  app.delete("/api/community-photos/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteCommunityPhoto(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Photo not found" });
    res.status(204).send();
  });

  // ============ DISCUSSIONS ============
  app.get("/api/discussions", async (req, res) => {
    const status = req.query.status as string || "approved";
    const discussions = await storage.getDiscussions(status);
    res.json(discussions);
  });

  app.get("/api/discussions/:id", async (req, res) => {
    const discussion = await storage.getDiscussion(req.params.id);
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });
    res.json(discussion);
  });

  app.post("/api/discussions", async (req, res) => {
    const parsed = insertDiscussionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const discussion = await storage.createDiscussion(parsed.data);
    res.status(201).json(discussion);
  });

  app.patch("/api/discussions/:id", requireAdmin, async (req, res) => {
    const discussion = await storage.updateDiscussion(req.params.id, req.body);
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });
    res.json(discussion);
  });

  app.delete("/api/discussions/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteDiscussion(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Discussion not found" });
    res.status(204).send();
  });

  // Discussion Replies
  app.get("/api/discussions/:id/replies", async (req, res) => {
    const replies = await storage.getDiscussionReplies(req.params.id);
    res.json(replies);
  });

  app.post("/api/discussions/:id/replies", async (req, res) => {
    const parsed = insertDiscussionReplySchema.safeParse({
      ...req.body,
      discussionId: req.params.id,
    });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const reply = await storage.createDiscussionReply(parsed.data);
    res.status(201).json(reply);
  });

  app.delete("/api/discussions/:discussionId/replies/:replyId", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteDiscussionReply(req.params.replyId);
    if (!deleted) return res.status(404).json({ error: "Reply not found" });
    res.status(204).send();
  });

  // ============ OBJECT STORAGE (File Upload) ============
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/community-photos/upload", async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      // Normalize path and set ACL to public so photos are accessible
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        { visibility: "public", owner: "system" }
      );
      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error processing uploaded photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Fix existing sponsor logos by setting them to public ACL
  app.post("/api/admin/fix-sponsor-logos", requireAdmin, async (req, res) => {
    try {
      const sponsors = await storage.getSponsors();
      const objectStorageService = new ObjectStorageService();
      let fixed = 0;
      
      for (const sponsor of sponsors) {
        if (sponsor.logoUrl && sponsor.logoUrl.startsWith("/objects/")) {
          try {
            const objectFile = await objectStorageService.getObjectEntityFile(sponsor.logoUrl);
            await objectFile.setMetadata({
              metadata: {
                "custom:aclPolicy": JSON.stringify({ visibility: "public", owner: "system" })
              }
            });
            fixed++;
          } catch (error) {
            console.error(`Failed to fix logo for sponsor ${sponsor.id}:`, error);
          }
        }
      }
      
      res.json({ success: true, fixed });
    } catch (error) {
      console.error("Error fixing sponsor logos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ SPONSOR INQUIRIES ============
  app.get("/api/sponsor-inquiries", requireAdmin, async (req, res) => {
    const inquiries = await storage.getSponsorInquiries();
    res.json(inquiries);
  });

  app.post("/api/sponsor-inquiries", async (req, res) => {
    const parsed = insertSponsorInquirySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const inquiry = await storage.createSponsorInquiry(parsed.data);
    res.status(201).json(inquiry);
  });

  app.patch("/api/sponsor-inquiries/:id", requireAdmin, async (req, res) => {
    const inquiry = await storage.updateSponsorInquiry(req.params.id, req.body);
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });
    res.json(inquiry);
  });

  // ============ CONTACT MESSAGES ============
  app.get("/api/contact-messages", requireAdmin, async (req, res) => {
    const messages = await storage.getContactMessages();
    res.json(messages);
  });

  app.post("/api/contact-messages", async (req, res) => {
    const parsed = insertContactMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const message = await storage.createContactMessage(parsed.data);
    res.status(201).json(message);
  });

  app.patch("/api/contact-messages/:id", requireAdmin, async (req, res) => {
    const message = await storage.updateContactMessage(req.params.id, req.body);
    if (!message) return res.status(404).json({ error: "Message not found" });
    res.json(message);
  });

  // Reply to contact message via email
  app.post("/api/contact-messages/:id/reply", requireAdmin, async (req, res) => {
    const { subject, message: replyMessage } = req.body;
    
    if (!subject || !replyMessage) {
      return res.status(400).json({ error: "Subject and message are required" });
    }
    
    const contactMessage = await storage.getContactMessage(req.params.id);
    if (!contactMessage) {
      return res.status(404).json({ error: "Contact message not found" });
    }
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0EDEB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Latest Talks</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <p style="color: #333; margin: 0 0 20px 0;">Hi ${contactMessage.name},</p>
        <div style="color: #444; line-height: 1.6;">
          ${replyMessage.replace(/\n/g, '<br>')}
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <p style="color: #888; margin: 0; font-size: 12px;">
          This is a response to your message sent to Latest Talks.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
    
    try {
      const result = await emailService.sendEmail({
        to: [contactMessage.email],
        subject,
        html,
      });
      
      if (result.success) {
        await storage.updateContactMessage(req.params.id, { status: "replied" });
        res.json({ success: true, message: "Reply sent successfully" });
      } else {
        res.status(500).json({ success: false, error: result.error || "Failed to send email" });
      }
    } catch (error: any) {
      console.error("Reply email error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Reply to sponsor inquiry via email
  app.post("/api/sponsor-inquiries/:id/reply", requireAdmin, async (req, res) => {
    const { subject, message: replyMessage } = req.body;
    
    if (!subject || !replyMessage) {
      return res.status(400).json({ error: "Subject and message are required" });
    }
    
    const inquiry = await storage.getSponsorInquiry(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ error: "Sponsor inquiry not found" });
    }
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0EDEB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Latest Talks</h1>
        <p style="color: #DE2026; margin: 5px 0 0 0; font-size: 14px;">Sponsorship Inquiry</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <p style="color: #333; margin: 0 0 20px 0;">Hi ${inquiry.contactName},</p>
        <div style="color: #444; line-height: 1.6;">
          ${replyMessage.replace(/\n/g, '<br>')}
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <p style="color: #888; margin: 0; font-size: 12px;">
          This is a response to your sponsorship inquiry for Latest Talks.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
    
    try {
      const result = await emailService.sendEmail({
        to: [inquiry.email],
        subject,
        html,
      });
      
      if (result.success) {
        await storage.updateSponsorInquiry(req.params.id, { status: "contacted" });
        res.json({ success: true, message: "Reply sent successfully" });
      } else {
        res.status(500).json({ success: false, error: result.error || "Failed to send email" });
      }
    } catch (error: any) {
      console.error("Reply email error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============ HOSTS ============
  app.get("/api/hosts", async (req, res) => {
    const hosts = await storage.getHosts();
    res.json(hosts);
  });

  app.get("/api/hosts/:id", async (req, res) => {
    const host = await storage.getHost(req.params.id);
    if (!host) return res.status(404).json({ error: "Host not found" });
    res.json(host);
  });

  app.post("/api/hosts", requireAdmin, async (req, res) => {
    const parsed = insertHostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const host = await storage.createHost(parsed.data);
    res.status(201).json(host);
  });

  app.patch("/api/hosts/:id", requireAdmin, async (req, res) => {
    const host = await storage.updateHost(req.params.id, req.body);
    if (!host) return res.status(404).json({ error: "Host not found" });
    res.json(host);
  });

  app.delete("/api/hosts/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteHost(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Host not found" });
    res.status(204).send();
  });

  // ============ USERS (Admin) ============
  app.get("/api/users", requireAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(u => ({ ...u, password: undefined })));
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    
    const existing = await storage.getUserByEmail(parsed.data.email);
    if (existing) return res.status(400).json({ error: "Email already exists" });
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
    const user = await storage.createUser({
      ...parsed.data,
      password: hashedPassword,
    });
    res.status(201).json({ ...user, password: undefined });
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    const updates = { ...req.body };
    
    // Hash password if provided
    if (updates.password && typeof updates.password === "string" && updates.password.length > 0) {
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password; // Don't update password if not provided
    }
    
    const user = await storage.updateUser(req.params.id, updates);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ...user, password: undefined });
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.status(204).send();
  });

  // Admin notification badges
  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const adminUserId = req.session.userId!;
      const counts = await storage.getAdminNotificationCounts(adminUserId);
      res.json(counts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const validSectionKeys = new Set(["comments", "messages", "guest-applications", "members", "subscribers", "whatsapp", "photos", "bug-reports"]);

  app.post("/api/admin/notifications/mark-seen", requireAdmin, async (req, res) => {
    try {
      const adminUserId = req.session.userId!;
      const { sectionKey } = req.body;
      if (!sectionKey || !validSectionKeys.has(sectionKey)) {
        return res.status(400).json({ error: "Invalid sectionKey" });
      }
      await storage.upsertAdminSectionView(adminUserId, sectionKey);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Check password - support both hashed and plain-text (legacy) passwords
    let passwordValid = false;
    if (user.password.startsWith("$2")) {
      // Bcrypt hashed password
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain-text password (for backward compatibility)
      passwordValid = user.password === password;
    }
    
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Set session data
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    
    // Generate admin token for fallback auth (webview cookie issues)
    let adminToken: string | undefined;
    if (user.role === "admin") {
      adminToken = generateAdminToken(user.id);
    }
    
    // Explicitly save session before responding
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to save session" });
      }
      res.json({ ...user, password: undefined, adminToken });
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({ ...user, password: undefined });
  });

  // ============ COMMENTS ============
  app.patch("/api/comments/:id", requireAdmin, async (req, res) => {
    const comment = await storage.updateComment(req.params.id, req.body);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    res.json(comment);
  });

  app.delete("/api/comments/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteComment(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Comment not found" });
    res.status(204).send();
  });

  // ============ GUESTS ============
  app.get("/api/guests", async (req, res) => {
    const guests = await storage.getGuests();
    res.json(guests);
  });

  app.get("/api/guests/:id", async (req, res) => {
    const guest = await storage.getGuest(req.params.id);
    if (!guest) return res.status(404).json({ error: "Guest not found" });
    res.json(guest);
  });

  app.post("/api/guests", requireAdmin, async (req, res) => {
    const parsed = insertGuestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const guest = await storage.createGuest(parsed.data);
    res.status(201).json(guest);
  });

  app.patch("/api/guests/:id", requireAdmin, async (req, res) => {
    const guest = await storage.updateGuest(req.params.id, req.body);
    if (!guest) return res.status(404).json({ error: "Guest not found" });
    res.json(guest);
  });

  app.delete("/api/guests/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteGuest(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Guest not found" });
    res.status(204).send();
  });

  // ============ MEMBERS (Latest Talks+) ============
  // Manual member signup (for manual payment processing)
  app.post("/api/members/manual-signup", async (req, res) => {
    const { name, email, phone, message, planType } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone are required" });
    }
    
    const duplicate = await storage.findDuplicateMembers({ email: email.trim().toLowerCase(), name: name.trim(), phone });
    if (duplicate) {
      const messages: Record<string, string> = {
        email: `The email "${email}" is already associated with a Plus member account. Signing up again will result in double billing. Please log in instead.`,
        phone: `The phone number you entered is already associated with a Plus member account (${duplicate.member.email}). Please log in with your existing account instead.`,
        name: `An account with the name "${name}" already exists (${duplicate.member.email}). If this is you, please log in instead. If not, please contact us for assistance.`,
      };
      return res.status(409).json({ error: messages[duplicate.field], code: "DUPLICATE_MEMBER", duplicateField: duplicate.field });
    }
    
    // Create member with pending status (no password since manual processing)
    const tempPassword = await bcrypt.hash(Math.random().toString(36), 10);
    const member = await storage.createMember({
      email,
      name,
      phone,
      password: tempPassword,
      planType: planType || "monthly",
      notes: message || undefined,
    });
    
    // Update to pending status
    await storage.updateMember(member.id, { 
      subscriptionStatus: "pending" 
    });
    
    res.status(201).json({ 
      success: true,
      message: "Signup request submitted. We will contact you shortly.",
    });
  });

  // Admin: Add member directly (with active status)
  app.post("/api/members/admin-add", requireAdmin, async (req, res) => {
    const { name, email, phone, planType, notes, customPrice, paymentMethod } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    
    const duplicate = await storage.findDuplicateMembers({ email: email.trim().toLowerCase(), name: name.trim(), phone });
    if (duplicate) {
      const messages: Record<string, string> = {
        email: `A member with email "${email}" already exists.`,
        phone: `A member with this phone number already exists (${duplicate.member.email}).`,
        name: `A member named "${name}" already exists (${duplicate.member.email}).`,
      };
      return res.status(409).json({ error: messages[duplicate.field], code: "DUPLICATE_MEMBER", duplicateField: duplicate.field });
    }
    
    // Create member with active status immediately
    const tempPassword = await bcrypt.hash(Math.random().toString(36), 10);
    
    // Calculate subscription end date based on plan
    const endDate = new Date();
    const effectivePlanType = planType || "monthly";
    if (effectivePlanType === "annual" || (effectivePlanType === "custom" && req.body.customPriceType === "yearly")) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (effectivePlanType === "free") {
      endDate.setFullYear(endDate.getFullYear() + 100);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }
    
    const member = await storage.createMember({
      email,
      name,
      phone: phone || undefined,
      password: tempPassword,
      planType: effectivePlanType,
      notes: notes || undefined,
      customPrice: customPrice || undefined,
      paymentMethod: paymentMethod || undefined,
    });
    
    // Update to active status with admin approval and end date
    await storage.updateMember(member.id, { 
      subscriptionStatus: "active",
      subscriptionEndDate: endDate,
      adminApproved: true,
    });
    
    res.status(201).json({ 
      success: true,
      message: "Member added successfully",
      id: member.id,
    });
  });

  // Member signup
  app.post("/api/members…10455 tokens truncated…   const flight = data.data[0];
      
      const departureCode = flight.departure?.iata || '';
      const arrivalCode = flight.arrival?.iata || '';
      
      if (!departureCode || !arrivalCode) {
        return res.status(404).json({
          error: "Route not found",
          message: "Could not determine route for this flight"
        });
      }

      res.json({
        route: `${departureCode} → ${arrivalCode}`,
        departure: {
          iata: departureCode,
          airport: flight.departure?.airport || '',
          city: flight.departure?.timezone?.split('/')[1]?.replace(/_/g, ' ') || ''
        },
        arrival: {
          iata: arrivalCode,
          airport: flight.arrival?.airport || '',
          city: flight.arrival?.timezone?.split('/')[1]?.replace(/_/g, ' ') || ''
        },
        airline: flight.airline?.name || '',
        flightNumber: flight.flight?.iata || flightIata
      });
      
    } catch (error: any) {
      console.error("Flight lookup error:", error);
      res.status(500).json({ 
        error: "Lookup failed",
        message: "Unable to lookup flight information at this time"
      });
    }
  });

  // ============================================
  // ADMIN PORTAL - OPERATIONS MANAGEMENT
  // ============================================

  // ============ TEAM MEMBERS ============
  app.get("/api/team-members", requireAdmin, async (req, res) => {
    const status = req.query.status as string;
    const members = await storage.getTeamMembers(status);
    res.json(members);
  });

  app.get("/api/team-members/:id", requireAdmin, async (req, res) => {
    const member = await storage.getTeamMember(req.params.id);
    if (!member) return res.status(404).json({ error: "Team member not found" });
    res.json(member);
  });

  app.post("/api/team-members", requireAdmin, async (req, res) => {
    const parsed = insertTeamMemberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const member = await storage.createTeamMember(parsed.data);
    res.status(201).json(member);
  });

  app.patch("/api/team-members/:id", requireAdmin, async (req, res) => {
    const member = await storage.updateTeamMember(req.params.id, req.body);
    if (!member) return res.status(404).json({ error: "Team member not found" });
    res.json(member);
  });

  app.delete("/api/team-members/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteTeamMember(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Team member not found" });
    res.status(204).send();
  });

  // ============ GUEST PIPELINE ============
  app.get("/api/guest-pipeline", requireAdmin, async (req, res) => {
    const { status, priority } = req.query;
    const items = await storage.getGuestPipeline({
      status: status as string,
      priority: priority as string,
    });
    res.json(items);
  });

  app.get("/api/guest-pipeline/:id", requireAdmin, async (req, res) => {
    const item = await storage.getGuestPipelineItem(req.params.id);
    if (!item) return res.status(404).json({ error: "Pipeline item not found" });
    res.json(item);
  });

  app.post("/api/guest-pipeline", requireAdmin, async (req, res) => {
    const parsed = insertGuestPipelineSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const item = await storage.createGuestPipelineItem(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/guest-pipeline/:id", requireAdmin, async (req, res) => {
    const item = await storage.updateGuestPipelineItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: "Pipeline item not found" });
    res.json(item);
  });

  app.delete("/api/guest-pipeline/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteGuestPipelineItem(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Pipeline item not found" });
    res.status(204).send();
  });

  // Send scheduling confirmation email to guest
  app.post("/api/guest-pipeline/:id/send-scheduling-email", requireAdmin, async (req, res) => {
    const guest = await storage.getGuestPipelineItem(req.params.id);
    if (!guest) return res.status(404).json({ error: "Guest not found" });
    
    // Get guest's email (check personal or work email)
    const guestEmail = guest.personalEmail || guest.workEmail;
    if (!guestEmail) {
      return res.status(400).json({ error: "Guest has no email address configured" });
    }
    
    if (!guest.scheduledDate) {
      return res.status(400).json({ error: "Guest has no scheduled date set" });
    }
    
    // Generate Google Maps link if not set
    if (!guest.googleMapsLink && guest.studioAddress) {
      await storage.updateGuestPipelineItem(guest.id, {
        googleMapsLink: generateGoogleMapsLink(guest.studioAddress)
      });
    }
    
    const emailHtml = generateGuestSchedulingEmail(guest);
    const result = await emailService.sendEmail({
      to: [guestEmail],
      subject: `You're Confirmed for Latest Talks! - ${new Date(guest.scheduledDate).toLocaleDateString()}`,
      html: emailHtml
    });
    
    if (result.success) {
      // Mark email as sent
      await storage.updateGuestPipelineItem(guest.id, {
        scheduledEmailSent: true,
        status: "scheduled"
      });
      res.json({ success: true, message: "Scheduling confirmation email sent" });
    } else {
      res.status(500).json({ error: result.error || "Failed to send email" });
    }
  });

  // Check and send reminder emails for all scheduled guests
  app.post("/api/guest-pipeline/check-reminders", requireAdmin, async (req, res) => {
    const scheduledGuests = await storage.getGuestPipeline({ status: "scheduled" });
    const now = new Date();
    const results = { sent1Day: 0, sent2Hours: 0, errors: 0 };
    
    for (const guest of scheduledGuests) {
      if (!guest.scheduledDate) continue;
      
      const guestEmail = guest.personalEmail || guest.workEmail;
      if (!guestEmail) continue;
      
      const scheduledDate = new Date(guest.scheduledDate);
      const hoursUntil = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Send 1-day reminder (20-28 hours before)
      if (!guest.reminder1DaySent && hoursUntil >= 20 && hoursUntil <= 28) {
        const emailHtml = generateGuestReminder1DayEmail(guest);
        const result = await emailService.sendEmail({
          to: [guestEmail],
          subject: "Reminder: Your Latest Talks Recording is Tomorrow!",
          html: emailHtml
        });
        
        if (result.success) {
          await storage.updateGuestPipelineItem(guest.id, { reminder1DaySent: true });
          results.sent1Day++;
        } else {
          results.errors++;
        }
      }
      
      // Send 2-hour reminder (1.5-2.5 hours before)
      if (!guest.reminder2HoursSent && hoursUntil >= 1.5 && hoursUntil <= 2.5) {
        const emailHtml = generateGuestReminder2HoursEmail(guest);
        const result = await emailService.sendEmail({
          to: [guestEmail],
          subject: "See You Soon! Your Latest Talks Recording is in 2 Hours",
          html: emailHtml
        });
        
        if (result.success) {
          await storage.updateGuestPipelineItem(guest.id, { reminder2HoursSent: true });
          results.sent2Hours++;
        } else {
          results.errors++;
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: `Sent ${results.sent1Day} 1-day reminders and ${results.sent2Hours} 2-hour reminders`,
      ...results
    });
  });

  // Manually send 1-day reminder to specific guest
  app.post("/api/guest-pipeline/:id/send-1day-reminder", requireAdmin, async (req, res) => {
    const guest = await storage.getGuestPipelineItem(req.params.id);
    if (!guest) return res.status(404).json({ error: "Guest not found" });
    
    const guestEmail = guest.personalEmail || guest.workEmail;
    if (!guestEmail) {
      return res.status(400).json({ error: "Guest has no email address configured" });
    }
    
    const emailHtml = generateGuestReminder1DayEmail(guest);
    const result = await emailService.sendEmail({
      to: [guestEmail],
      subject: "Reminder: Your Latest Talks Recording is Tomorrow!",
      html: emailHtml
    });
    
    if (result.success) {
      await storage.updateGuestPipelineItem(guest.id, { reminder1DaySent: true });
      res.json({ success: true, message: "1-day reminder sent" });
    } else {
      res.status(500).json({ error: result.error || "Failed to send email" });
    }
  });

  // Manually send 2-hour reminder to specific guest
  app.post("/api/guest-pipeline/:id/send-2hour-reminder", requireAdmin, async (req, res) => {
    const guest = await storage.getGuestPipelineItem(req.params.id);
    if (!guest) return res.status(404).json({ error: "Guest not found" });
    
    const guestEmail = guest.personalEmail || guest.workEmail;
    if (!guestEmail) {
      return res.status(400).json({ error: "Guest has no email address configured" });
    }
    
    const emailHtml = generateGuestReminder2HoursEmail(guest);
    const result = await emailService.sendEmail({
      to: [guestEmail],
      subject: "See You Soon! Your Latest Talks Recording is in 2 Hours",
      html: emailHtml
    });
    
    if (result.success) {
      await storage.updateGuestPipelineItem(guest.id, { reminder2HoursSent: true });
      res.json({ success: true, message: "2-hour reminder sent" });
    } else {
      res.status(500).json({ error: result.error || "Failed to send email" });
    }
  });

  // ============ EPISODE AD SLOTS ============
  app.get("/api/episodes/:id/ad-slots", requireAdmin, async (req, res) => {
    const slots = await storage.getEpisodeAdSlots(req.params.id);
    res.json(slots);
  });

  app.post("/api/episode-ad-slots", requireAdmin, async (req, res) => {
    const parsed = insertEpisodeAdSlotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const slot = await storage.createEpisodeAdSlot(parsed.data);
    res.status(201).json(slot);
  });

  app.patch("/api/episode-ad-slots/:id", requireAdmin, async (req, res) => {
    const slot = await storage.updateEpisodeAdSlot(req.params.id, req.body);
    if (!slot) return res.status(404).json({ error: "Ad slot not found" });
    res.json(slot);
  });

  app.delete("/api/episode-ad-slots/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteEpisodeAdSlot(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Ad slot not found" });
    res.status(204).send();
  });

  // ============ EPISODE COSTS ============
  app.get("/api/episodes/:id/costs", requireAdmin, async (req, res) => {
    const costs = await storage.getEpisodeCosts(req.params.id);
    res.json(costs);
  });

  app.post("/api/episode-costs", requireAdmin, async (req, res) => {
    const parsed = insertEpisodeCostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const cost = await storage.createEpisodeCost(parsed.data);
    res.status(201).json(cost);
  });

  app.patch("/api/episode-costs/:id", requireAdmin, async (req, res) => {
    const cost = await storage.updateEpisodeCost(req.params.id, req.body);
    if (!cost) return res.status(404).json({ error: "Cost not found" });
    res.json(cost);
  });

  app.delete("/api/episode-costs/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteEpisodeCost(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Cost not found" });
    res.status(204).send();
  });

  // ============ EPISODE PRODUCTION ============
  app.get("/api/episode-productions", requireAdmin, async (req, res) => {
    const status = req.query.status as string;
    const productions = await storage.getAllEpisodeProductions({ status });
    res.json(productions);
  });

  app.get("/api/episodes/:id/production", requireAdmin, async (req, res) => {
    const production = await storage.getEpisodeProduction(req.params.id);
    if (!production) return res.status(404).json({ error: "Production record not found" });
    res.json(production);
  });

  app.post("/api/episode-productions", requireAdmin, async (req, res) => {
    const parsed = insertEpisodeProductionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const production = await storage.createEpisodeProduction(parsed.data);
    res.status(201).json(production);
  });

  app.patch("/api/episode-productions/:id", requireAdmin, async (req, res) => {
    const production = await storage.updateEpisodeProduction(req.params.id, req.body);
    if (!production) return res.status(404).json({ error: "Production record not found" });
    res.json(production);
  });

  // ============ EXPENSES ============
  app.get("/api/expenses", requireAdmin, async (req, res) => {
    const { category, projectId, episodeId } = req.query;
    const expensesList = await storage.getExpenses({
      category: category as string,
      projectId: projectId as string,
      episodeId: episodeId as string,
    });
    res.json(expensesList);
  });

  app.get("/api/expenses/:id", requireAdmin, async (req, res) => {
    const expense = await storage.getExpense(req.params.id);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.json(expense);
  });

  app.post("/api/expenses", requireAdmin, async (req, res) => {
    const parsed = insertExpenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const expense = await storage.createExpense(parsed.data);
    res.status(201).json(expense);
  });

  app.patch("/api/expenses/:id", requireAdmin, async (req, res) => {
    const expense = await storage.updateExpense(req.params.id, req.body);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.json(expense);
  });

  app.delete("/api/expenses/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteExpense(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Expense not found" });
    res.status(204).send();
  });

  // ============ PROJECTS ============
  app.get("/api/projects", requireAdmin, async (req, res) => {
    const status = req.query.status as string;
    const projectsList = await storage.getProjects(status);
    res.json(projectsList);
  });

  app.get("/api/projects/:id", requireAdmin, async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  app.post("/api/projects", requireAdmin, async (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const project = await storage.createProject(parsed.data);
    res.status(201).json(project);
  });

  app.patch("/api/projects/:id", requireAdmin, async (req, res) => {
    const project = await storage.updateProject(req.params.id, req.body);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteProject(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Project not found" });
    res.status(204).send();
  });

  // ============ PROJECT SPONSORS ============
  app.get("/api/projects/:id/sponsors", requireAdmin, async (req, res) => {
    const sponsors = await storage.getProjectSponsors(req.params.id);
    res.json(sponsors);
  });

  app.post("/api/project-sponsors", requireAdmin, async (req, res) => {
    const parsed = insertProjectSponsorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const sponsor = await storage.createProjectSponsor(parsed.data);
    res.status(201).json(sponsor);
  });

  app.patch("/api/project-sponsors/:id", requireAdmin, async (req, res) => {
    const sponsor = await storage.updateProjectSponsor(req.params.id, req.body);
    if (!sponsor) return res.status(404).json({ error: "Project sponsor not found" });
    res.json(sponsor);
  });

  app.delete("/api/project-sponsors/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteProjectSponsor(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Project sponsor not found" });
    res.status(204).send();
  });

  // ============ SPONSOR DEALS ============
  app.get("/api/sponsor-deals", requireAdmin, async (req, res) => {
    const sponsorId = req.query.sponsorId as string;
    const deals = await storage.getSponsorDeals(sponsorId);
    res.json(deals);
  });

  app.get("/api/sponsor-deals/:id", requireAdmin, async (req, res) => {
    const deal = await storage.getSponsorDeal(req.params.id);
    if (!deal) return res.status(404).json({ error: "Sponsor deal not found" });
    res.json(deal);
  });

  app.post("/api/sponsor-deals", requireAdmin, async (req, res) => {
    const parsed = insertSponsorDealSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const deal = await storage.createSponsorDeal(parsed.data);
    res.status(201).json(deal);
  });

  app.patch("/api/sponsor-deals/:id", requireAdmin, async (req, res) => {
    const deal = await storage.updateSponsorDeal(req.params.id, req.body);
    if (!deal) return res.status(404).json({ error: "Sponsor deal not found" });
    res.json(deal);
  });

  app.delete("/api/sponsor-deals/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteSponsorDeal(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Sponsor deal not found" });
    res.status(204).send();
  });

  // ============ MONTHLY FINANCIALS ============
  app.get("/api/monthly-financials", requireAdmin, async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const financials = await storage.getMonthlyFinancials(year);
    res.json(financials);
  });

  app.get("/api/monthly-financials/:year/:month", requireAdmin, async (req, res) => {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const financial = await storage.getMonthlyFinancial(year, month);
    if (!financial) return res.status(404).json({ error: "Financial record not found" });
    res.json(financial);
  });

  app.post("/api/monthly-financials", requireAdmin, async (req, res) => {
    const parsed = insertMonthlyFinancialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const financial = await storage.createOrUpdateMonthlyFinancial(parsed.data);
    res.status(201).json(financial);
  });

  // ============ YEARLY AD INCOME ============
  app.get("/api/yearly-ad-income", requireAdmin, async (req, res) => {
    const income = await storage.getYearlyAdIncome();
    res.json(income);
  });

  app.post("/api/yearly-ad-income", requireAdmin, async (req, res) => {
    const parsed = insertYearlyAdIncomeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const income = await storage.createOrUpdateYearlyAdIncome(parsed.data);
    res.status(201).json(income);
  });

  // ============ AD SLOT REQUESTS ============
  app.get("/api/ad-slot-requests", requireAdmin, async (req, res) => {
    const status = req.query.status as string | undefined;
    const requests = await storage.getAdSlotRequests(status);
    res.json(requests);
  });

  app.get("/api/ad-slot-requests/:id", requireAdmin, async (req, res) => {
    const request = await storage.getAdSlotRequest(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  });

  app.post("/api/ad-slot-requests", async (req, res) => {
    const parsed = insertAdSlotRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const request = await storage.createAdSlotRequest(parsed.data);
    res.status(201).json(request);
  });

  app.patch("/api/ad-slot-requests/:id", requireAdmin, async (req, res) => {
    const request = await storage.updateAdSlotRequest(req.params.id, req.body);
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  });

  app.delete("/api/ad-slot-requests/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteAdSlotRequest(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Request not found" });
    res.json({ success: true });
  });

  // ============ WHATSAPP INTEGRATION ============
  
  // Check if WhatsApp is configured
  app.get("/api/whatsapp/status", requireAdmin, async (req, res) => {
    res.json({ 
      configured: whatsappService.isConfigured(),
      message: whatsappService.isConfigured() 
        ? "WhatsApp Business API is configured" 
        : "WhatsApp not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN"
    });
  });

  // WhatsApp stats
  app.get("/api/whatsapp/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await whatsappService.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WhatsApp Contacts
  app.get("/api/whatsapp/contacts", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const contacts = await whatsappService.getContacts(status);
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/whatsapp/contacts", requireAdmin, async (req, res) => {
    try {
      const parsed = insertWhatsappContactSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const contact = await whatsappService.addContact(parsed.data);
      res.status(201).json(contact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/whatsapp/contacts/:id", requireAdmin, async (req, res) => {
    try {
      const contact = await whatsappService.updateContact(req.params.id, req.body);
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/whatsapp/contacts/:id", requireAdmin, async (req, res) => {
    try {
      await whatsappService.deleteContact(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public WhatsApp opt-in endpoint
  app.post("/api/whatsapp/opt-in", async (req, res) => {
    try {
      const phone = req.body.phone || req.body.phoneNumber;
      const name = req.body.name;
      if (!phone) return res.status(400).json({ error: "Phone number is required" });
      
      const contact = await whatsappService.addContact({
        phone,
        name,
        waId: phone.replace(/\D/g, ""),
        optInSource: "website",
        status: "active"
      });
      res.status(201).json({ success: true, message: "Successfully subscribed to WhatsApp updates" });
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        res.status(400).json({ error: "This phone number is already subscribed" });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Alias for public opt-in (supports /api/whatsapp/contacts/opt-in)
  app.post("/api/whatsapp/contacts/opt-in", async (req, res) => {
    try {
      const phone = req.body.phone || req.body.phoneNumber;
      const name = req.body.name;
      if (!phone) return res.status(400).json({ error: "Phone number is required" });
      
      const contact = await whatsappService.addContact({
        phone,
        name,
        waId: phone.replace(/\D/g, ""),
        optInSource: "website",
        status: "active"
      });
      res.status(201).json({ success: true, message: "Successfully subscribed to WhatsApp updates" });
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        res.status(400).json({ error: "This phone number is already subscribed" });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // WhatsApp Templates
  app.get("/api/whatsapp/templates", requireAdmin, async (req, res) => {
    try {
      const templates = await whatsappService.getTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/whatsapp/templates", requireAdmin, async (req, res) => {
    try {
      const parsed = insertWhatsappTemplateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const template = await whatsappService.addTemplate(parsed.data);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/whatsapp/templates/:id", requireAdmin, async (req, res) => {
    try {
      const template = await whatsappService.updateTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/whatsapp/templates/:id", requireAdmin, async (req, res) => {
    try {
      await whatsappService.deleteTemplate(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WhatsApp Send Logs
  app.get("/api/whatsapp/send-logs", requireAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await whatsappService.getSendLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/whatsapp/send-logs/:id", requireAdmin, async (req, res) => {
    try {
      const details = await whatsappService.getSendLogDetails(req.params.id);
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Broadcast episode to WhatsApp contacts
  app.post("/api/whatsapp/broadcast/episode", requireAdmin, async (req, res) => {
    try {
      if (!whatsappService.isConfigured()) {
        return res.status(400).json({ 
          error: "WhatsApp not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN" 
        });
      }
      
      const { episodeId, templateName } = req.body;
      if (!episodeId) return res.status(400).json({ error: "Episode ID is required" });
      if (!templateName) return res.status(400).json({ error: "Template name is required" });
      
      const userId = req.session?.userId || "admin";
      const result = await whatsappService.broadcastEpisode(episodeId, templateName, userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send announcement to WhatsApp contacts
  app.post("/api/whatsapp/broadcast/announcement", requireAdmin, async (req, res) => {
    try {
      if (!whatsappService.isConfigured()) {
        return res.status(400).json({ 
          error: "WhatsApp not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN" 
        });
      }
      
      const { message, tags } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });
      
      const userId = req.session?.userId || "admin";
      const result = await whatsappService.sendAnnouncement(message, userId, tags);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WhatsApp Webhook (for receiving status updates from Meta)
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"] as string;
    const token = req.query["hub.verify_token"] as string;
    const challenge = req.query["hub.challenge"] as string;
    
    const result = whatsappService.verifyWebhook(mode, token, challenge);
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(403).send("Forbidden");
    }
  });

  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      await whatsappService.handleWebhook(req.body);
      res.status(200).send("EVENT_RECEIVED");
    } catch (error: any) {
      console.error("WhatsApp webhook error:", error);
      res.status(200).send("EVENT_RECEIVED");
    }
  });

  // ============ BUG REPORTS ============
  // Public submission
  app.post("/api/bug-reports", async (req, res) => {
    try {
      const parsed = insertBugReportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const report = await storage.createBugReport(parsed.data);
      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin routes
  app.get("/api/bug-reports", requireAdmin, async (req, res) => {
    const { status, priority } = req.query;
    const reports = await storage.getBugReports({
      status: status as string,
      priority: priority as string,
    });
    res.json(reports);
  });

  // Mark all bug reports as read (must be before :id routes)
  app.post("/api/bug-reports/mark-all-read", requireAdmin, async (req, res) => {
    try {
      await storage.markAllBugReportsRead();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bug-reports/:id", requireAdmin, async (req, res) => {
    const report = await storage.getBugReport(req.params.id);
    if (!report) return res.status(404).json({ error: "Bug report not found" });
    res.json(report);
  });

  app.patch("/api/bug-reports/:id", requireAdmin, async (req, res) => {
    const existing = await storage.getBugReport(req.params.id);
    if (!existing) return res.status(404).json({ error: "Bug report not found" });
    
    const updates: any = { ...req.body };
    
    // Track resolution time
    if (updates.status === "resolved" && existing.status !== "resolved") {
      updates.resolvedAt = new Date();
    }
    
    // Track response time
    if (updates.adminResponse && !existing.adminResponse) {
      updates.respondedAt = new Date();
    }
    
    const report = await storage.updateBugReport(req.params.id, updates);
    res.json(report);
  });

  app.delete("/api/bug-reports/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteBugReport(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Bug report not found" });
    res.json({ success: true });
  });

  // Reply to bug report via email
  app.post("/api/bug-reports/:id/reply", requireAdmin, async (req, res) => {
    try {
      const report = await storage.getBugReport(req.params.id);
      if (!report) return res.status(404).json({ error: "Bug report not found" });
      if (!report.reporterEmail) return res.status(400).json({ error: "No email address for this reporter" });
      
      const { subject, message } = req.body;
      if (!subject || !message) return res.status(400).json({ error: "Subject and message are required" });
      
      await emailService.sendEmail({
        to: report.reporterEmail,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10213A;">Latest Talks - Bug Report Update</h2>
            <p>Hello${report.reporterName ? ` ${report.reporterName}` : ''},</p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">Original issue: ${report.title}</p>
            <p style="color: #999; font-size: 12px;">Thank you for helping us improve Latest Talks!</p>
          </div>
        `,
      });
      
      // Update the report with the response
      await storage.updateBugReport(req.params.id, {
        adminResponse: message,
        respondedAt: new Date(),
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =============================================
  // GUEST APPLICATIONS
  // =============================================

  // Public - Submit guest application
  app.post("/api/guest-applications", async (req, res) => {
    try {
      const parsed = insertGuestApplicationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      }
      
      const application = await storage.createGuestApplication(parsed.data);
      
      // Send confirmation email to applicant
      try {
        await emailService.sendEmail({
          to: application.email,
          subject: "Latest Talks - Guest Application Received",
          html: `
            <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F0EDEB; padding: 30px;">
              <div style="background: #10213A; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Latest Talks</h1>
              </div>
              <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #10213A; margin-top: 0;">Hi ${application.fullName}!</h2>
                <p style="color: #333; line-height: 1.6;">
                  Thank you for your interest in being a guest on Latest Talks! We've received your application and are excited to learn more about you.
                </p>
                <p style="color: #333; line-height: 1.6;">
                  Our team will review your submission and if your profile is a good fit for our show, a team member will reach out to you with further instructions.
                </p>
                <div style="background: #F0EDEB; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #666; font-size: 14px;"><strong>What happens next?</strong></p>
                  <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Our team reviews applications weekly</li>
                    <li>If selected, you'll receive scheduling details</li>
                    <li>You'll get a calendar invite with studio address</li>
                    <li>A reminder will be sent 24 hours before recording</li>
                  </ul>
                </div>
                <p style="color: #333; line-height: 1.6;">
                  In the meantime, feel free to check out our latest episodes at <a href="https://latesttalks.com" style="color: #DE2026;">latesttalks.com</a>
                </p>
                <hr style="border: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px; margin: 0;">
                  Questions? Reply to this email or contact us at hello@latesttalks.com
                </p>
              </div>
            </div>
          `,
        });
        
        // Mark confirmation email as sent
        await storage.updateGuestApplication(application.id, { confirmationEmailSent: true });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the whole request if email fails
      }
      
      res.json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin - Get all guest applications
  app.get("/api/guest-applications", requireAdmin, async (req, res) => {
    const { status } = req.query;
    const applications = await storage.getGuestApplications(status as string);
    res.json(applications);
  });

  // Admin - Get single guest application
  app.get("/api/guest-applications/:id", requireAdmin, async (req, res) => {
    const application = await storage.getGuestApplication(req.params.id);
    if (!application) return res.status(404).json({ error: "Application not found" });
    res.json(application);
  });

  // Admin - Update guest application (accept, decline, schedule)
  app.patch("/api/guest-applications/:id", requireAdmin, async (req, res) => {
    const existing = await storage.getGuestApplication(req.params.id);
    if (!existing) return res.status(404).json({ error: "Application not found" });
    
    const updated = await storage.updateGuestApplication(req.params.id, req.body);
    res.json(updated);
  });

  // Admin - Delete guest application
  app.delete("/api/guest-applications/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteGuestApplication(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Application not found" });
    res.json({ success: true });
  });

  // Admin - Send calendar invite for accepted guest
  app.post("/api/guest-applications/:id/send-invite", requireAdmin, async (req, res) => {
    try {
      const application = await storage.getGuestApplication(req.params.id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      if (application.status !== "accepted") return res.status(400).json({ error: "Application must be accepted first" });
      if (!application.scheduledDate) return res.status(400).json({ error: "Schedule date is required" });
      
      const { studioAddress, googleMapsLink } = req.body;
      const address = studioAddress || application.studioAddress || "Hashkifa Studios, Brooklyn, NY";
      const mapsLink = googleMapsLink || "https://maps.google.com/?q=Hashkifa+Studios+Brooklyn+NY";
      
      // Generate ICS calendar file content
      const startDate = new Date(application.scheduledDate);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
      
      const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      };
      
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Latest Talks//Podcast Recording//EN
BEGIN:VEVENT
UID:${application.id}@latesttalks.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:Latest Talks Podcast Recording
DESCRIPTION:You are scheduled to record an episode of Latest Talks! Please arrive 15 minutes early.\\n\\nStudio Address: ${address}\\n\\nGoogle Maps: ${mapsLink}
LOCATION:${address}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder: Latest Talks recording tomorrow!
TRIGGER:-P1D
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder: Latest Talks recording in 2 hours!
TRIGGER:-PT2H
END:VALARM
END:VEVENT
END:VCALENDAR`;

      // Send email with calendar invite
      await emailService.sendEmail({
        to: application.email,
        subject: "Latest Talks - You're Scheduled! 🎙️",
        html: `
          <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F0EDEB; padding: 30px;">
            <div style="background: #10213A; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Latest Talks</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #10213A; margin-top: 0;">Great news, ${application.fullName}!</h2>
              <p style="color: #333; line-height: 1.6;">
                Your guest application has been <strong style="color: #27ae60;">accepted</strong>! We're thrilled to have you on the show.
              </p>
              
              <div style="background: #10213A; color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #DE2026;">Recording Details</h3>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${address}</p>
                <a href="${mapsLink}" style="color: #DE2026; display: inline-block; margin-top: 10px;">📍 Get Directions</a>
              </div>
              
              <div style="background: #F0EDEB; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;"><strong>Important reminders:</strong></p>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Please arrive 15 minutes early</li>
                  <li>Bring any materials you'd like to reference</li>
                  <li>You'll receive a reminder 24 hours before</li>
                </ul>
              </div>
              
              <p style="color: #333; line-height: 1.6;">
                A calendar invite is attached to this email. Add it to your calendar to receive automatic reminders.
              </p>
              
              <hr style="border: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px; margin: 0;">
                Questions? Reply to this email or contact us at hello@latesttalks.com
              </p>
            </div>
          </div>
        `,
        attachments: [{
          filename: 'latest-talks-recording.ics',
          content: Buffer.from(icsContent).toString('base64'),
          contentType: 'text/calendar',
        }],
      });
      
      // Update application
      await storage.updateGuestApplication(application.id, {
        calendarInviteSent: true,
        studioAddress: address,
      });
      
      res.json({ success: true, message: "Calendar invite sent successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // UPCOMING EPISODE INFO (Advertise Section)
  // ============================================

  // Public - Get upcoming episode info
  app.get("/api/upcoming-episode", async (req, res) => {
    const info = await storage.getUpcomingEpisodeInfo();
    res.json(info || null);
  });

  // Admin - Update upcoming episode info
  app.post("/api/upcoming-episode", requireAdmin, async (req, res) => {
    try {
      const { title, guestName, guestImageUrl, thumbnailUrl, topic, releaseDate, isActive } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      const info = await storage.createOrUpdateUpcomingEpisodeInfo({
        title,
        guestName,
        guestImageUrl: guestImageUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        topic,
        releaseDate,
        isActive: isActive ?? true,
      });
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PLATFORM KPIs
  // ============================================

  const requirePlatformUser = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.platformUserId) return res.status(403).json({ error: "Platform login required" });
    next();
  };

  // Platform Auth
  app.post("/api/platform-auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });
      const user = await storage.getPlatformUserByEmail(email);
      if (!user || user.status !== "active") return res.status(401).json({ error: "Invalid credentials" });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });
      const platform = await storage.getPlatform(user.platformId);
      if (!platform) return res.status(500).json({ error: "Platform not found" });
      req.session.platformUserId = user.id;
      req.session.platformId = user.platformId;
      const response: any = {
        user: { id: user.id, email: user.email, platformId: user.platformId, mustChangePassword: user.mustChangePassword },
        platform: { id: platform.id, name: platform.name },
      };
      if (user.mustChangePassword) response.mustChangePassword = true;
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/platform-auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Failed to logout" });
      res.json({ success: true });
    });
  });

  app.get("/api/platform-auth/me", async (req, res) => {
    if (!req.session?.platformUserId) return res.status(401).json({ error: "Not logged in" });
    const user = await storage.getPlatformUser(req.session.platformUserId);
    if (!user) return res.status(401).json({ error: "User not found" });
    const platform = await storage.getPlatform(user.platformId);
    res.json({
      id: user.id,
      email: user.email,
      platformId: user.platformId,
      platformName: platform?.name || "",
      mustChangePassword: user.mustChangePassword,
    });
  });

  app.post("/api/platform-auth/change-password", async (req, res) => {
    if (!req.session?.platformUserId) return res.status(403).json({ error: "Platform login required" });
    try {
      const { oldPassword, currentPassword, newPassword } = req.body;
      const actualOldPassword = oldPassword || currentPassword;
      if (!actualOldPassword || !newPassword) return res.status(400).json({ error: "Old and new password required" });
      if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
      const user = await storage.getPlatformUser(req.session.platformUserId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const valid = await bcrypt.compare(actualOldPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid old password" });
      const hash = await bcrypt.hash(newPassword, 10);
      await storage.updatePlatformUser(user.id, { passwordHash: hash, mustChangePassword: false });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Platform Management
  app.get("/api/platforms", requireAdmin, async (_req, res) => {
    const platforms = await storage.getPlatforms();
    res.json(platforms);
  });

  app.post("/api/platforms", requireAdmin, async (req, res) => {
    const parsed = insertPlatformSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const platform = await storage.createPlatform(parsed.data);
    res.status(201).json(platform);
  });

  app.get("/api/platforms/:id", requireAdmin, async (req, res) => {
    const platform = await storage.getPlatform(req.params.id);
    if (!platform) return res.status(404).json({ error: "Platform not found" });
    const contacts = await storage.getPlatformContacts(req.params.id);
    res.json({ ...platform, contacts });
  });

  app.patch("/api/platforms/:id", requireAdmin, async (req, res) => {
    const platform = await storage.updatePlatform(req.params.id, req.body);
    if (!platform) return res.status(404).json({ error: "Platform not found" });
    res.json(platform);
  });

  app.delete("/api/platforms/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deletePlatform(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Platform not found" });
    res.status(204).send();
  });

  app.get("/api/platforms/:id/contacts", requireAdmin, async (req, res) => {
    const contacts = await storage.getPlatformContacts(req.params.id);
    res.json(contacts);
  });

  app.post("/api/platforms/:id/contacts", requireAdmin, async (req, res) => {
    const parsed = insertPlatformContactSchema.safeParse({ ...req.body, platformId: req.params.id });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const contact = await storage.createPlatformContact(parsed.data);
    res.status(201).json(contact);
  });

  app.delete("/api/platform-contacts/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deletePlatformContact(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Contact not found" });
    res.status(204).send();
  });

  app.get("/api/platforms/:id/users", requireAdmin, async (req, res) => {
    const users = await storage.getPlatformUsers(req.params.id);
    res.json(users.map(u => ({ ...u, passwordHash: undefined })));
  });

  app.post("/api/platforms/:id/users", requireAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const tempPassword = Math.random().toString(36).substring(2, 10);
      const hash = await bcrypt.hash(tempPassword, 10);
      const user = await storage.createPlatformUser({
        platformId: req.params.id,
        email,
        passwordHash: hash,
        mustChangePassword: true,
        status: "active",
      });
      res.status(201).json({ user: { ...user, passwordHash: undefined }, tempPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/platform-users/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deletePlatformUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.status(204).send();
  });

  app.post("/api/platform-users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const tempPassword = Math.random().toString(36).substring(2, 10);
      const hash = await bcrypt.hash(tempPassword, 10);
      const user = await storage.updatePlatformUser(req.params.id, { passwordHash: hash, mustChangePassword: true });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ tempPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/platforms/:id/kpis", requireAdmin, async (req, res) => {
    try {
      const kpis = await storage.getEpisodeKpisByPlatform(req.params.id);
      const kpisWithEpisodes = await Promise.all(kpis.map(async (kpi) => {
        const episode = await storage.getEpisodeWithGuests(kpi.websiteEpisodeId);
        return {
          ...kpi,
          episodeNumber: episode?.episodeNumber ?? null,
          episodeTitle: episode?.title ?? null,
          guestName: episode?.guest?.name ?? null,
        };
      }));
      res.json(kpisWithEpisodes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/platform-kpis/:id/lock", requireAdmin, async (req, res) => {
    try {
      const { isLocked } = req.body;
      const kpiId = req.params.id;
      const allKpis = await storage.getEpisodeKpisByPlatform(req.body.platformId || "");
      const kpi = allKpis.find(k => k.id === kpiId);
      if (!kpi) return res.status(404).json({ error: "KPI not found" });
      const updated = await storage.upsertEpisodeKpi({
        platformId: kpi.platformId,
        websiteEpisodeId: kpi.websiteEpisodeId,
        isLocked: isLocked !== undefined ? isLocked : !kpi.isLocked,
      } as any);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/episodes/:episodeId/lock-kpis", requireAdmin, async (req, res) => {
    try {
      const { globalLocked } = req.body;
      const kpis = await storage.getEpisodeKpis(req.params.episodeId);
      for (const kpi of kpis) {
        await storage.upsertEpisodeKpi({
          platformId: kpi.platformId,
          websiteEpisodeId: kpi.websiteEpisodeId,
          globalLocked: globalLocked ?? true,
        } as any);
      }
      res.json({ success: true, count: kpis.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Platform Portal
  app.get("/api/platform-portal/episodes", requirePlatformUser, async (req, res) => {
    try {
      const platformId = req.session.platformId!;
      const episodes = await storage.getEpisodesWithGuests({ status: "published" });
      const results = await Promise.all(episodes.map(async (episode) => {
        const kpi = await storage.getKpiByPlatformAndEpisode(platformId, episode.id);
        return {
          websiteEpisodeId: episode.id,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          guestName: episode.guest?.name || null,
          totalWatchTimeSeconds: kpi?.totalWatchTimeSeconds || null,
          views: kpi?.views || null,
          avgWatchTimeSeconds: kpi?.avgWatchTimeSeconds || null,
          kpi1Auto: kpi?.kpi1Auto || false,
          kpi2Auto: kpi?.kpi2Auto || false,
          kpi3Auto: kpi?.kpi3Auto || false,
          isLocked: kpi?.isLocked || false,
          globalLocked: kpi?.globalLocked || false,
        };
      }));
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/platform-portal/kpis", requirePlatformUser, async (req, res) => {
    try {
      const platformId = req.session.platformId!;
      const platformUserId = req.session.platformUserId!;
      let { websiteEpisodeId, totalWatchTimeSeconds, views, avgWatchTimeSeconds } = req.body;
      if (!websiteEpisodeId) return res.status(400).json({ error: "websiteEpisodeId is required" });

      const existing = await storage.getKpiByPlatformAndEpisode(platformId, websiteEpisodeId);
      if (existing && (existing.isLocked || existing.globalLocked)) {
        return res.status(403).json({ error: "KPI data is locked and cannot be modified" });
      }

      let kpi1Auto = false, kpi2Auto = false, kpi3Auto = false;
      const hasKpi1 = totalWatchTimeSeconds != null;
      const hasKpi2 = views != null;
      const hasKpi3 = avgWatchTimeSeconds != null;
      const providedCount = [hasKpi1, hasKpi2, hasKpi3].filter(Boolean).length;

      if (providedCount === 2) {
        if (hasKpi1 && hasKpi2 && !hasKpi3) {
          if (views > 0) {
            avgWatchTimeSeconds = Math.round(totalWatchTimeSeconds / views);
            kpi3Auto = true;
          }
        } else if (hasKpi1 && hasKpi3 && !hasKpi2) {
          if (avgWatchTimeSeconds > 0) {
            views = Math.round(totalWatchTimeSeconds / avgWatchTimeSeconds);
            kpi2Auto = true;
          }
        } else if (hasKpi2 && hasKpi3 && !hasKpi1) {
          totalWatchTimeSeconds = views * avgWatchTimeSeconds;
          kpi1Auto = true;
        }
      }

      const warnings: string[] = [];
      if (existing) {
        if (totalWatchTimeSeconds != null && existing.totalWatchTimeSeconds != null && totalWatchTimeSeconds < existing.totalWatchTimeSeconds) {
          warnings.push(`totalWatchTimeSeconds decreased from ${existing.totalWatchTimeSeconds} to ${totalWatchTimeSeconds}`);
        }
        if (views != null && existing.views != null && views < existing.views) {
          warnings.push(`views decreased from ${existing.views} to ${views}`);
        }
        if (avgWatchTimeSeconds != null && existing.avgWatchTimeSeconds != null && avgWatchTimeSeconds < existing.avgWatchTimeSeconds) {
          warnings.push(`avgWatchTimeSeconds decreased from ${existing.avgWatchTimeSeconds} to ${avgWatchTimeSeconds}`);
        }

        if (totalWatchTimeSeconds != null && totalWatchTimeSeconds !== existing.totalWatchTimeSeconds) {
          await storage.createKpiHistoryEntry({
            platformId, websiteEpisodeId, fieldChanged: "totalWatchTimeSeconds",
            previousValue: existing.totalWatchTimeSeconds?.toString() || null,
            newValue: totalWatchTimeSeconds.toString(), userId: platformUserId, editSource: "api",
          });
        }
        if (views != null && views !== existing.views) {
          await storage.createKpiHistoryEntry({
            platformId, websiteEpisodeId, fieldChanged: "views",
            previousValue: existing.views?.toString() || null,
            newValue: views.toString(), userId: platformUserId, editSource: "api",
          });
        }
        if (avgWatchTimeSeconds != null && avgWatchTimeSeconds !== existing.avgWatchTimeSeconds) {
          await storage.createKpiHistoryEntry({
            platformId, websiteEpisodeId, fieldChanged: "avgWatchTimeSeconds",
            previousValue: existing.avgWatchTimeSeconds?.toString() || null,
            newValue: avgWatchTimeSeconds.toString(), userId: platformUserId, editSource: "api",
          });
        }
      }

      const result = await storage.upsertEpisodeKpi({
        platformId,
        websiteEpisodeId,
        totalWatchTimeSeconds: totalWatchTimeSeconds ?? null,
        views: views ?? null,
        avgWatchTimeSeconds: avgWatchTimeSeconds ?? null,
        kpi1Auto, kpi2Auto, kpi3Auto,
        updateSource: "api",
      } as any);

      const response: any = { kpi: result };
      if (warnings.length > 0) response.warnings = warnings;
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin KPI Dashboard
  app.get("/api/platform-kpis/dashboard", requireAdmin, async (_req, res) => {
    try {
      const platformsList = await storage.getPlatforms();
      let totalViews = 0;
      let totalWatchTimeSeconds = 0;
      const episodeIds = new Set<string>();

      for (const platform of platformsList) {
        const kpis = await storage.getEpisodeKpisByPlatform(platform.id);
        for (const kpi of kpis) {
          totalViews += kpi.views || 0;
          totalWatchTimeSeconds += kpi.totalWatchTimeSeconds || 0;
          episodeIds.add(kpi.websiteEpisodeId);
        }
      }

      res.json({
        totalViews,
        totalWatchTimeSeconds,
        avgWatchTimeSeconds: totalViews > 0 ? Math.round(totalWatchTimeSeconds / totalViews) : 0,
        platformCount: platformsList.length,
        episodeCount: episodeIds.size,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/platform-kpis/history/:platformId", requireAdmin, async (req, res) => {
    try {
      const episodeId = req.query.episodeId as string | undefined;
      const history = await storage.getKpiHistory(req.params.platformId, episodeId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
