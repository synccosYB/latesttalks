import { db } from "./db";
import { users, hosts, sponsors } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Starting database seed...");

  // Check if admin already exists
  const [existingAdmin] = await db.select().from(users).where(eq(users.email, "admin@latesttalks.com"));
  
  if (!existingAdmin) {
    // Seed admin user with hashed password PR@latesttalks
    const hashedPassword = await bcrypt.hash("PR@latesttalks", 10);
    await db.insert(users).values({
      email: "admin@latesttalks.com",
      password: hashedPassword,
      name: "Pinchus Raab",
      role: "admin",
      status: "active",
    });
    console.log("Admin user created: admin@latesttalks.com");
  } else {
    console.log("Admin user already exists");
  }

  // Check if host already exists
  const existingHosts = await db.select().from(hosts);
  if (existingHosts.length === 0) {
    await db.insert(hosts).values({
      name: "Pinchus Raab",
      title: "Host & Producer",
      bio: "Creator and host of Latest Talks Podcast. Bringing top-quality Yiddish entertainment through engaging conversations with fascinating guests.",
      email: "pinchus@latesttalks.com",
      socialLinks: [
        { platform: "instagram", url: "https://www.instagram.com/latest_talks/" },
        { platform: "linkedin", url: "https://www.linkedin.com/company/latesttalks" },
      ],
      order: 0,
    });
    console.log("Host created: Pinchus Raab");
  } else {
    console.log("Host already exists");
  }

  // Check if sponsors already exist
  const existingSponsors = await db.select().from(sponsors);
  if (existingSponsors.length === 0) {
    const sponsorData = [
      { name: "CardRight", website: "https://cardright.com/LT", contactEmail: "info@cardright.com" },
      { name: "United Refuah", website: "https://unitedrefuah.org" },
      { name: "Luxury Kosher Villas", website: "https://luxurykoshervillas.com", contactPhone: "+1305-650-8830" },
      { name: "Appliance Choice", contactPhone: "845-402-1703" },
      { name: "Hiring4Less", website: "https://hiring4less.com", contactEmail: "info@hiring4less.com", contactPhone: "+1845-682-0990" },
      { name: "Jell Tel", contactPhone: "+1212-444-1122" },
    ];

    for (const sponsor of sponsorData) {
      await db.insert(sponsors).values(sponsor);
    }
    console.log(`Created ${sponsorData.length} sponsors`);
  } else {
    console.log(`${existingSponsors.length} sponsors already exist`);
  }

  console.log("Seed complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
