import { db } from "./db";
import { 
  whatsappContacts, 
  whatsappTemplates, 
  whatsappSendLogs, 
  whatsappMessages,
  whatsappWebhookEvents,
  episodes,
  type WhatsappContact,
  type WhatsappTemplate,
  type WhatsappSendLog,
  type WhatsappMessage,
  type InsertWhatsappContact,
  type InsertWhatsappTemplate,
  type InsertWhatsappSendLog,
  type InsertWhatsappMessage,
  type Episode
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
}

function getConfig(): WhatsAppConfig {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "latest_talks_webhook";

  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp API not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN");
  }

  return { phoneNumberId, accessToken, webhookVerifyToken };
}

function isConfigured(): boolean {
  return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

async function sendTemplateMessage(
  to: string,
  templateName: string,
  language: string,
  components?: any[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getConfig();
    
    const response = await fetch(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "template",
          template: {
            name: templateName,
            language: { code: language },
            components: components || []
          }
        })
      }
    );

    const data = await response.json();

    if (response.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    } else {
      return { 
        success: false, 
        error: data.error?.message || "Failed to send message" 
      };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendTextMessage(
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getConfig();
    
    const response = await fetch(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: text }
        })
      }
    );

    const data = await response.json();

    if (response.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    } else {
      return { 
        success: false, 
        error: data.error?.message || "Failed to send message" 
      };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function broadcastEpisode(
  episodeId: string,
  templateName: string,
  userId: string
): Promise<WhatsappSendLog> {
  const [episode] = await db.select().from(episodes).where(eq(episodes.id, episodeId));
  if (!episode) {
    throw new Error("Episode not found");
  }

  const activeContacts = await db.select()
    .from(whatsappContacts)
    .where(eq(whatsappContacts.status, "active"));

  const [template] = await db.select()
    .from(whatsappTemplates)
    .where(eq(whatsappTemplates.name, templateName));

  const [sendLog] = await db.insert(whatsappSendLogs).values({
    episodeId,
    templateId: template?.id,
    templateName,
    messageType: "episode",
    recipientCount: activeContacts.length,
    sentByUserId: userId,
    status: "sending",
    sentAt: new Date()
  }).returning();

  let sentCount = 0;
  let failedCount = 0;

  for (const contact of activeContacts) {
    const components = [
      {
        type: "body",
        parameters: [
          { type: "text", text: episode.title },
          { type: "text", text: episode.guestName || "Special Guest" }
        ]
      }
    ];

    if (template?.headerType === "image" && episode.thumbnailUrl) {
      components.unshift({
        type: "header",
        parameters: [
          { type: "image", image: { link: episode.thumbnailUrl } }
        ]
      } as any);
    }

    const result = await sendTemplateMessage(
      contact.waId,
      templateName,
      template?.language || "en",
      components
    );

    await db.insert(whatsappMessages).values({
      sendLogId: sendLog.id,
      contactId: contact.id,
      waMessageId: result.messageId,
      status: result.success ? "sent" : "failed",
      failureReason: result.error,
      sentAt: result.success ? new Date() : undefined
    });

    if (result.success) {
      sentCount++;
      await db.update(whatsappContacts)
        .set({ lastMessageAt: new Date() })
        .where(eq(whatsappContacts.id, contact.id));
    } else {
      failedCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const [updatedLog] = await db.update(whatsappSendLogs)
    .set({
      sentCount,
      failedCount,
      status: "completed",
      completedAt: new Date()
    })
    .where(eq(whatsappSendLogs.id, sendLog.id))
    .returning();

  return updatedLog;
}

async function sendAnnouncement(
  message: string,
  userId: string,
  tags?: string[]
): Promise<WhatsappSendLog> {
  let contactsQuery = db.select().from(whatsappContacts).where(eq(whatsappContacts.status, "active"));
  const activeContacts = await contactsQuery;

  const filteredContacts = tags && tags.length > 0
    ? activeContacts.filter(c => c.tags?.some(t => tags.includes(t)))
    : activeContacts;

  const [sendLog] = await db.insert(whatsappSendLogs).values({
    messageType: "announcement",
    recipientCount: filteredContacts.length,
    sentByUserId: userId,
    status: "sending",
    customMessage: message,
    sentAt: new Date()
  }).returning();

  let sentCount = 0;
  let failedCount = 0;

  for (const contact of filteredContacts) {
    const result = await sendTextMessage(contact.waId, message);

    await db.insert(whatsappMessages).values({
      sendLogId: sendLog.id,
      contactId: contact.id,
      waMessageId: result.messageId,
      status: result.success ? "sent" : "failed",
      failureReason: result.error,
      sentAt: result.success ? new Date() : undefined
    });

    if (result.success) {
      sentCount++;
      await db.update(whatsappContacts)
        .set({ lastMessageAt: new Date() })
        .where(eq(whatsappContacts.id, contact.id));
    } else {
      failedCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const [updatedLog] = await db.update(whatsappSendLogs)
    .set({
      sentCount,
      failedCount,
      status: "completed",
      completedAt: new Date()
    })
    .where(eq(whatsappSendLogs.id, sendLog.id))
    .returning();

  return updatedLog;
}

async function handleWebhook(body: any): Promise<void> {
  await db.insert(whatsappWebhookEvents).values({
    eventType: "raw",
    payload: body,
    processedAt: new Date()
  });

  if (body.entry) {
    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        if (change.field === "messages") {
          const value = change.value;
          
          for (const status of value.statuses || []) {
            const waMessageId = status.id;
            const messageStatus = status.status;

            const updateData: Partial<WhatsappMessage> = {};
            
            if (messageStatus === "delivered") {
              updateData.status = "delivered";
              updateData.deliveredAt = new Date();
            } else if (messageStatus === "read") {
              updateData.status = "read";
              updateData.readAt = new Date();
            } else if (messageStatus === "failed") {
              updateData.status = "failed";
              updateData.failureReason = status.errors?.[0]?.message || "Unknown error";
            }

            if (Object.keys(updateData).length > 0) {
              await db.update(whatsappMessages)
                .set(updateData)
                .where(eq(whatsappMessages.waMessageId, waMessageId));

              const [message] = await db.select()
                .from(whatsappMessages)
                .where(eq(whatsappMessages.waMessageId, waMessageId));

              if (message?.sendLogId) {
                await updateSendLogCounts(message.sendLogId);
              }
            }
          }
        }
      }
    }
  }
}

async function updateSendLogCounts(sendLogId: string): Promise<void> {
  const messages = await db.select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.sendLogId, sendLogId));

  const counts = {
    deliveredCount: messages.filter(m => m.status === "delivered" || m.status === "read").length,
    readCount: messages.filter(m => m.status === "read").length,
    failedCount: messages.filter(m => m.status === "failed").length
  };

  await db.update(whatsappSendLogs)
    .set(counts)
    .where(eq(whatsappSendLogs.id, sendLogId));
}

function verifyWebhook(mode: string, token: string, challenge: string): string | null {
  const config = getConfig();
  if (mode === "subscribe" && token === config.webhookVerifyToken) {
    return challenge;
  }
  return null;
}

async function getContacts(status?: string): Promise<WhatsappContact[]> {
  if (status) {
    return db.select().from(whatsappContacts).where(eq(whatsappContacts.status, status)).orderBy(desc(whatsappContacts.createdAt));
  }
  return db.select().from(whatsappContacts).orderBy(desc(whatsappContacts.createdAt));
}

async function addContact(data: InsertWhatsappContact): Promise<WhatsappContact> {
  const waId = data.phone.replace(/\D/g, "");
  const [contact] = await db.insert(whatsappContacts).values({
    ...data,
    waId
  }).returning();
  return contact;
}

async function updateContact(id: string, data: Partial<InsertWhatsappContact>): Promise<WhatsappContact> {
  const [contact] = await db.update(whatsappContacts)
    .set(data)
    .where(eq(whatsappContacts.id, id))
    .returning();
  return contact;
}

async function deleteContact(id: string): Promise<void> {
  await db.delete(whatsappContacts).where(eq(whatsappContacts.id, id));
}

async function getTemplates(): Promise<WhatsappTemplate[]> {
  return db.select().from(whatsappTemplates).orderBy(desc(whatsappTemplates.createdAt));
}

async function addTemplate(data: InsertWhatsappTemplate): Promise<WhatsappTemplate> {
  const insertData = {
    name: data.name,
    bodyText: data.bodyText,
    category: data.category,
    language: data.language,
    headerType: data.headerType,
    headerContent: data.headerContent,
    footerText: data.footerText,
    buttons: data.buttons as {type: string, text: string, url?: string}[] | undefined,
    status: data.status
  };
  const [template] = await db.insert(whatsappTemplates).values(insertData).returning();
  return template;
}

async function updateTemplate(id: string, data: Partial<InsertWhatsappTemplate>): Promise<WhatsappTemplate> {
  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.bodyText !== undefined) updateData.bodyText = data.bodyText;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.headerType !== undefined) updateData.headerType = data.headerType;
  if (data.headerContent !== undefined) updateData.headerContent = data.headerContent;
  if (data.footerText !== undefined) updateData.footerText = data.footerText;
  if (data.buttons !== undefined) updateData.buttons = data.buttons as {type: string, text: string, url?: string}[];
  if (data.status !== undefined) updateData.status = data.status;

  const [template] = await db.update(whatsappTemplates)
    .set(updateData)
    .where(eq(whatsappTemplates.id, id))
    .returning();
  return template;
}

async function deleteTemplate(id: string): Promise<void> {
  await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id));
}

async function getSendLogs(limit: number = 50): Promise<WhatsappSendLog[]> {
  return db.select().from(whatsappSendLogs).orderBy(desc(whatsappSendLogs.createdAt)).limit(limit);
}

async function getSendLogDetails(id: string): Promise<{log: WhatsappSendLog; messages: WhatsappMessage[]}> {
  const [log] = await db.select().from(whatsappSendLogs).where(eq(whatsappSendLogs.id, id));
  const messages = await db.select().from(whatsappMessages).where(eq(whatsappMessages.sendLogId, id));
  return { log, messages };
}

async function getStats(): Promise<{
  totalContacts: number;
  activeContacts: number;
  totalMessagesSent: number;
  deliveryRate: number;
  readRate: number;
}> {
  const contacts = await db.select().from(whatsappContacts);
  const messages = await db.select().from(whatsappMessages);

  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.status === "active").length;
  const totalMessagesSent = messages.filter(m => m.status !== "pending").length;
  const delivered = messages.filter(m => m.status === "delivered" || m.status === "read").length;
  const read = messages.filter(m => m.status === "read").length;

  return {
    totalContacts,
    activeContacts,
    totalMessagesSent,
    deliveryRate: totalMessagesSent > 0 ? Math.round((delivered / totalMessagesSent) * 100) : 0,
    readRate: totalMessagesSent > 0 ? Math.round((read / totalMessagesSent) * 100) : 0
  };
}

export const whatsappService = {
  isConfigured,
  getConfig,
  sendTemplateMessage,
  sendTextMessage,
  broadcastEpisode,
  sendAnnouncement,
  handleWebhook,
  verifyWebhook,
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getSendLogs,
  getSendLogDetails,
  getStats
};
