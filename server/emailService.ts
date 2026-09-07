import postmark from "postmark";
import type { Episode, Sponsor, GuestPipeline } from "@shared/schema";

interface EmailConfig {
  serverToken: string | undefined;
  senderEmail: string;
  senderName: string;
  replyTo?: string;
}

interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  config?: Partial<EmailConfig>;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private client: postmark.ServerClient | null = null;

  private getClient(): postmark.ServerClient | null {
    const serverToken = process.env.POSTMARK_SERVER_TOKEN;
    if (!serverToken) {
      return null;
    }
    if (!this.client) {
      this.client = new postmark.ServerClient(serverToken);
    }
    return this.client;
  }

  private getConfig(): EmailConfig {
    return {
      serverToken: process.env.POSTMARK_SERVER_TOKEN,
      senderEmail: process.env.SENDER_EMAIL || "hello@latesttalks.com",
      senderName: "Latest Talks",
    };
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const config = { ...this.getConfig(), ...params.config };
    const client = this.getClient();
    
    if (!client || !config.serverToken) {
      console.log("Email service not configured (no Postmark server token). Would send:", {
        to: params.to.length + " recipients",
        subject: params.subject,
      });
      return { success: false, error: "Email service not configured" };
    }

    try {
      for (const recipient of params.to) {
        const result = await client.sendEmail({
          From: config.senderEmail,
          To: recipient,
          Subject: params.subject,
          HtmlBody: params.html,
          MessageStream: "outbound",
        });
        console.log("Postmark email sent:", result.MessageID);
      }
      return { success: true, messageId: "batch-sent" };
    } catch (error: any) {
      console.error("Error sending Postmark email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkEmails(
    recipients: string[],
    subject: string,
    html: string,
    batchSize = 50
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const result = await this.sendEmail({ to: batch, subject, html });
      
      if (result.success) {
        sent += batch.length;
      } else {
        failed += batch.length;
      }
      
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { sent, failed };
  }
}

export const emailService = new EmailService();

export function generateNewEpisodeEmail(episode: Episode): string {
  const watchUrl = `https://latesttalks.com/video/${episode.id}`;
  const thumbnailUrl = episode.thumbnailUrl || `https://img.youtube.com/vi/${episode.youtubeId}/maxresdefault.jpg`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Episode: ${episode.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0EDEB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Latest Talks</h1>
        <p style="color: #DE2026; margin: 5px 0 0 0; font-size: 14px;">The Biggest Jewish Network in Yiddish</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="color: #10213A; margin: 0 0 20px 0; font-size: 22px;">New Episode Just Dropped!</h2>
        
        <a href="${watchUrl}" style="display: block; text-decoration: none;">
          <img src="${thumbnailUrl}" alt="${episode.title}" style="width: 100%; border-radius: 8px; margin-bottom: 15px;">
        </a>
        
        <h3 style="color: #10213A; margin: 0 0 10px 0; font-size: 18px;">${episode.title}</h3>
        
        ${episode.guestName ? `<p style="color: #666; margin: 0 0 15px 0;">Guest: ${episode.guestName}</p>` : ''}
        
        ${episode.description ? `<p style="color: #444; margin: 0 0 20px 0; line-height: 1.6;">${episode.description.substring(0, 200)}${episode.description.length > 200 ? '...' : ''}</p>` : ''}
        
        <a href="${watchUrl}" style="display: inline-block; background-color: #DE2026; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Watch Now</a>
      </td>
    </tr>
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px;">Follow us on social media</p>
        <p style="margin: 0;">
          <a href="https://www.instagram.com/latest_talks/" style="color: #DE2026; text-decoration: none; margin: 0 10px;">Instagram</a>
          <a href="https://www.youtube.com/c/LatestTalks" style="color: #DE2026; text-decoration: none; margin: 0 10px;">YouTube</a>
          <a href="https://t.me/Latest_Talks" style="color: #DE2026; text-decoration: none; margin: 0 10px;">Telegram</a>
        </p>
        <p style="color: #888; margin: 15px 0 0 0; font-size: 12px;">
          You're receiving this because you subscribed to Latest Talks updates.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateMilestoneEmail(
  sponsor: Sponsor,
  milestone: number,
  totalViews: number,
  geographicData?: { country: string; percentage: number }[]
): string {
  const formattedMilestone = milestone.toLocaleString();
  const formattedTotal = totalViews.toLocaleString();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Reached: ${formattedMilestone} Views!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0EDEB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Latest Talks</h1>
        <p style="color: #DE2026; margin: 5px 0 0 0; font-size: 14px;">Sponsor Analytics Report</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px; text-align: center;">
        <div style="background: linear-gradient(135deg, #10213A 0%, #1a3a5c 100%); border-radius: 12px; padding: 30px; margin-bottom: 25px;">
          <p style="color: #DE2026; font-size: 14px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Congratulations!</p>
          <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 48px; font-weight: bold;">${formattedMilestone}</h2>
          <p style="color: #ffffff; margin: 0; font-size: 16px;">Views Milestone Reached</p>
        </div>
        
        <h3 style="color: #10213A; margin: 0 0 15px 0;">Dear ${sponsor.name} Team,</h3>
        
        <p style="color: #444; margin: 0 0 20px 0; line-height: 1.6;">
          We're thrilled to inform you that your sponsored content on Latest Talks has just reached 
          <strong>${formattedMilestone} total views</strong>! Your current total is <strong>${formattedTotal} views</strong>.
        </p>
        
        ${geographicData && geographicData.length > 0 ? `
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
          <h4 style="color: #10213A; margin: 0 0 15px 0;">Geographic Distribution</h4>
          ${geographicData.slice(0, 5).map(g => `
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #ddd;">
              <span style="color: #444;">${g.country}</span>
              <span style="color: #10213A; font-weight: bold;">${g.percentage}%</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <p style="color: #444; margin: 20px 0; line-height: 1.6;">
          Thank you for partnering with Latest Talks. Your support helps us continue delivering 
          top-quality Yiddish entertainment to our growing audience worldwide.
        </p>
        
        <p style="color: #10213A; font-weight: bold; margin: 20px 0;">
          Interested in extending your sponsorship?<br>
          Contact us at <a href="mailto:sponsors@latesttalks.com" style="color: #DE2026;">sponsors@latesttalks.com</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px;">Latest Talks - The Biggest Jewish Network in Yiddish</p>
        <p style="color: #888; margin: 10px 0 0 0; font-size: 12px;">
          This is an automated milestone report for our valued sponsors.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Format date for email display
function formatScheduledDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  }).format(date);
}

// Generate Google Maps link from address
export function generateGoogleMapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Guest Scheduling Confirmation Email
export function generateGuestSchedulingEmail(guest: GuestPipeline): string {
  const scheduledDate = guest.scheduledDate ? new Date(guest.scheduledDate) : new Date();
  const formattedDate = formatScheduledDate(scheduledDate);
  const googleMapsLink = guest.googleMapsLink || generateGoogleMapsLink(guest.studioAddress || "Latest Talks Studio, Brooklyn, NY");
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Scheduled! - Latest Talks Podcast</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0EDEB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #10213A; padding: 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Latest Talks</h1>
        <p style="color: #DE2026; margin: 8px 0 0 0; font-size: 14px;">The Biggest Jewish Network in Yiddish</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 35px 25px;">
        <h2 style="color: #10213A; margin: 0 0 25px 0; font-size: 24px; text-align: center;">
          You're Confirmed! 🎙️
        </h2>
        
        <p style="color: #444; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
          Dear ${guest.name},
        </p>
        
        <p style="color: #444; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
          We're excited to confirm your upcoming appearance on the <strong>Latest Talks</strong> podcast! 
          Here are the details for your recording session:
        </p>
        
        <div style="background: linear-gradient(135deg, #10213A 0%, #1a3a5c 100%); border-radius: 12px; padding: 25px; margin: 0 0 25px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #DE2026; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date & Time</span>
                <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${formattedDate} (EST)</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 15px 0 8px 0; border-top: 1px solid rgba(255,255,255,0.2);">
                <span style="color: #DE2026; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Location</span>
                <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 16px;">${guest.studioAddress || "Latest Talks Studio, Brooklyn, NY"}</p>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${googleMapsLink}" style="display: inline-block; background-color: #DE2026; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            📍 Get Directions
          </a>
        </div>
        
        <div style="background-color: #f8f7f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h4 style="color: #10213A; margin: 0 0 12px 0; font-size: 16px;">What to Expect:</h4>
          <ul style="color: #444; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Recording typically lasts 60-90 minutes</li>
            <li>Arrive 15 minutes early for setup</li>
            <li>Light refreshments will be provided</li>
            <li>Business casual attire recommended</li>
          </ul>
        </div>
        
        <p style="color: #444; margin: 25px 0 0 0; font-size: 16px; line-height: 1.6;">
          If you have any questions or need to reschedule, please contact us at 
          <a href="mailto:hello@latesttalks.com" style="color: #DE2026;">hello@latesttalks.com</a>.
        </p>
        
        <p style="color: #444; margin: 20px 0 0 0; font-size: 16px; line-height: 1.6;">
          We look forward to having you on the show!
        </p>
        
        <p style="color: #10213A; margin: 25px 0 0 0; font-weight: bold;">
          The Latest Talks Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px;">Follow us on social media</p>
        <p style="margin: 0;">
          <a href="https://www.instagram.com/latest_talks/" style="color: #DE2026; text-decoration: none; margin: 0 10px;">Instagram</a>
          <a href="https://www.youtube.com/c/LatestTalks" style="color: #DE2026; text-decoration: none; margin: 0 10px;">YouTube</a>
          <a href="https://t.me/Latest_Talks" style="color: #DE2026; text-decoration: none; margin: 0 10px;">Telegram</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Guest Reminder Email (1 day before)
export function generateGuestReminder1DayEmail(guest: GuestPipeline): string {
  const scheduledDate = guest.scheduledDate ? new Date(guest.scheduledDate) : new Date();
  const formattedDate = formatScheduledDate(scheduledDate);
  const googleMapsLink = guest.googleMapsLink || generateGoogleMapsLink(guest.studioAddress || "Latest Talks Studio, Brooklyn, NY");
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tomorrow's Recording - Latest Talks Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0EDEB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #10213A; padding: 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Latest Talks</h1>
        <p style="color: #DE2026; margin: 8px 0 0 0; font-size: 14px;">Reminder</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 35px 25px;">
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
          <p style="color: #856404; margin: 0; font-weight: bold; font-size: 16px;">
            ⏰ Your recording is TOMORROW!
          </p>
        </div>
        
        <p style="color: #444; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
          Dear ${guest.name},
        </p>
        
        <p style="color: #444; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
          Just a friendly reminder that you're scheduled to appear on <strong>Latest Talks</strong> tomorrow!
        </p>
        
        <div style="background: linear-gradient(135deg, #10213A 0%, #1a3a5c 100%); border-radius: 12px; padding: 25px; margin: 0 0 25px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #DE2026; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date & Time</span>
                <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${formattedDate} (EST)</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 15px 0 8px 0; border-top: 1px solid rgba(255,255,255,0.2);">
                <span style="color: #DE2026; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Location</span>
                <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 16px;">${guest.studioAddress || "Latest Talks Studio, Brooklyn, NY"}</p>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${googleMapsLink}" style="display: inline-block; background-color: #DE2026; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            📍 Get Directions
          </a>
        </div>
        
        <div style="background-color: #f8f7f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h4 style="color: #10213A; margin: 0 0 12px 0; font-size: 16px;">Quick Reminders:</h4>
          <ul style="color: #444; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Please arrive 15 minutes early</li>
            <li>Bring any materials you'd like to reference</li>
            <li>Get a good night's rest!</li>
          </ul>
        </div>
        
        <p style="color: #444; margin: 25px 0 0 0; font-size: 16px; line-height: 1.6;">
          If you have any last-minute questions, reach out to us at 
          <a href="mailto:hello@latesttalks.com" style="color: #DE2026;">hello@latesttalks.com</a>.
        </p>
        
        <p style="color: #10213A; margin: 25px 0 0 0; font-weight: bold;">
          See you tomorrow!<br>
          The Latest Talks Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <p style="color: #888; margin: 0; font-size: 12px;">
          This is an automated reminder from Latest Talks.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Guest Reminder Email (2 hours before)
export function generateGuestReminder2HoursEmail(guest: GuestPipeline): string {
  const scheduledDate = guest.scheduledDate ? new Date(guest.scheduledDate) : new Date();
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  }).format(scheduledDate);
  const googleMapsLink = guest.googleMapsLink || generateGoogleMapsLink(guest.studioAddress || "Latest Talks Studio, Brooklyn, NY");
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>See You Soon! - Latest Talks</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0EDEB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #10213A; padding: 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Latest Talks</h1>
        <p style="color: #DE2026; margin: 8px 0 0 0; font-size: 14px;">Final Reminder</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 35px 25px;">
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
          <p style="color: #155724; margin: 0; font-weight: bold; font-size: 18px;">
            🎙️ We'll see you in 2 hours!
          </p>
        </div>
        
        <p style="color: #444; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
          Hi ${guest.name},
        </p>
        
        <p style="color: #444; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
          Your recording session at <strong>Latest Talks</strong> starts at <strong>${formattedTime} (EST)</strong>. 
          We're so excited to have you!
        </p>
        
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 12px; padding: 30px; margin: 0 0 25px 0; text-align: center;">
          <p style="color: rgba(255,255,255,0.9); margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Recording Starts At</p>
          <p style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold;">${formattedTime}</p>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Eastern Time</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${googleMapsLink}" style="display: inline-block; background-color: #DE2026; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px;">
            📍 Open in Maps
          </a>
          <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">
            ${guest.studioAddress || "Latest Talks Studio, Brooklyn, NY"}
          </p>
        </div>
        
        <p style="color: #444; margin: 25px 0 0 0; font-size: 16px; line-height: 1.6; text-align: center;">
          <strong>Remember to arrive 15 minutes early!</strong>
        </p>
        
        <p style="color: #10213A; margin: 30px 0 0 0; font-weight: bold; text-align: center;">
          See you very soon! 🎉<br>
          The Latest Talks Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #10213A; padding: 20px; text-align: center;">
        <p style="color: #888; margin: 0; font-size: 12px;">
          Questions? Call or text us, or email <a href="mailto:hello@latesttalks.com" style="color: #DE2026;">hello@latesttalks.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
