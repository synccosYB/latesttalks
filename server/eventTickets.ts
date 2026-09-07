export const EVENT = {
  name: "Latest Talks Podcast Live", subtitle: "התעורר־זיץ תשפ״ז",
  date: "Thursday, September 17, 2026", time: "7:45–11:00 PM",
  venue: "Young Israel Beth El of Boro Park", address: "4802 15th Ave, Brooklyn, NY 11219",
  priceCents: 2000, capacity: 1000,
} as const;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]!));
}

const CODE39: Record<string, string> = {
  "0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw","5":"wnnwwnnnn","6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn",
  "A":"wnnnnwnnw","B":"nnwnnwnnw","C":"wnwnnwnnn","D":"nnnnwwnnw","E":"wnnnwwnnn","F":"nnwnwwnnn","G":"nnnnnwwnw","H":"wnnnnwwnn","I":"nnwnnwwnn","J":"nnnnwwwnn",
  "K":"wnnnnnnww","L":"nnwnnnnww","M":"wnwnnnnwn","N":"nnnnwnnww","O":"wnnnwnnwn","P":"nnwnwnnwn","Q":"nnnnnnwww","R":"wnnnnnwwn","S":"nnwnnnwwn","T":"nnnnwnwwn",
  "U":"wwnnnnnnw","V":"nwwnnnnnw","W":"wwwnnnnnn","X":"nwnnwnnnw","Y":"wwnnwnnnn","Z":"nwwnwnnnn","-":"nwnnnnwnw",".":"wwnnnnwnn"," ":"nwwnnnwnn","*":"nwnnwnwnn"
};

function code39Svg(value: string) {
  const encoded = `*${value.toUpperCase()}*`;
  let x = 12;
  const bars: string[] = [];
  for (const char of encoded) {
    const pattern = CODE39[char] || CODE39["-"];
    pattern.split("").forEach((width, index) => {
      const w = width === "w" ? 3 : 1;
      if (index % 2 === 0) bars.push(`<rect x="${x}" y="8" width="${w}" height="72"/>`);
      x += w;
    });
    x += 1;
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${x + 12}" height="94" viewBox="0 0 ${x + 12} 94"><rect width="100%" height="100%" fill="white"/><g fill="black">${bars.join("")}</g></svg>`);
}

async function sendResendEmail(input: { to: string | string[]; subject: string; html: string; attachments?: {filename:string;content:string;content_id?:string}[] }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Latest Talks Events <tickets@event.latesttalks.com>", reply_to: "Hello@latesttalks.com", ...input }),
  });
  if (!response.ok) throw new Error(`Resend rejected the message (${response.status})`);
}

export async function sendTicketEmails(ticket: {orderNumber:string;ticketCode:string;buyerName:string;buyerEmail:string;buyerPhone?:string|null;quantity:number;amountCents:number;solaReferenceNumber:string}) {
  const barcode = code39Svg(ticket.ticketCode);
  const safeName = escapeHtml(ticket.buyerName);
  const total = (ticket.amountCents / 100).toFixed(2);
  const html = `<!doctype html><html><body style="margin:0;background:#f0edeb;font-family:Arial,sans-serif;color:#10213a"><table width="100%"><tr><td align="center" style="padding:28px 12px"><table width="600" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden"><tr><td style="background:#10213a;padding:24px;text-align:center;color:#fff"><div style="font-size:25px;font-weight:700">Latest Talks</div><div style="color:#ef4444;margin-top:5px">EVENT TICKET</div></td></tr><tr><td style="padding:32px;text-align:center"><h1 style="margin:0 0 4px;font-size:27px">${EVENT.name}</h1><div dir="rtl" style="font-size:24px;font-weight:700;margin-bottom:24px">${EVENT.subtitle}</div><p style="font-size:17px;line-height:1.6">Admit <strong>${ticket.quantity}</strong><br>${EVENT.date} · ${EVENT.time}<br>${EVENT.venue}<br>${EVENT.address}</p><img src="cid:event-ticket-barcode" width="360" height="94" alt="Ticket barcode" style="max-width:100%;height:auto"><div style="font-family:monospace;font-size:17px;letter-spacing:1px;font-weight:700">${ticket.ticketCode}</div><p style="color:#657080;font-size:13px">Present this barcode at the entrance.</p><hr style="border:0;border-top:1px solid #e5e7eb;margin:25px 0"><p style="text-align:left;line-height:1.7"><strong>Purchased by:</strong> ${safeName}<br><strong>Order:</strong> ${ticket.orderNumber}<br><strong>Paid:</strong> $${total}</p></td></tr></table></td></tr></table></body></html>`;
  await sendResendEmail({ to: ticket.buyerEmail, subject: `Your ticket — ${EVENT.name}`, html, attachments: [{ filename: `${ticket.ticketCode}.svg`, content: barcode.toString("base64"), content_id: "event-ticket-barcode" }] });
  await sendResendEmail({ to: "Hello@latesttalks.com", subject: `Ticket purchased: ${ticket.quantity} — ${safeName}`, html: `<h2>New event ticket purchase</h2><p><strong>Buyer:</strong> ${safeName}<br><strong>Email:</strong> ${escapeHtml(ticket.buyerEmail)}<br><strong>Phone:</strong> ${escapeHtml(ticket.buyerPhone || "Not provided")}<br><strong>Quantity:</strong> ${ticket.quantity}<br><strong>Total:</strong> $${total}<br><strong>Order:</strong> ${ticket.orderNumber}<br><strong>Ticket code:</strong> ${ticket.ticketCode}<br><strong>Sola reference:</strong> ${escapeHtml(ticket.solaReferenceNumber)}</p>` });
}
