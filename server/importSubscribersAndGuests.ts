import { db } from "./db";
import { subscribers, guests, episodes } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

interface ParsedSubscriber {
  email: string;
  name: string | null;
}

async function importSubscribers() {
  console.log("\n========================================");
  console.log("IMPORTING SUBSCRIBERS");
  console.log("========================================\n");
  
  const jsonPath = "./scripts/parsed-subscribers.json";
  
  if (!fs.existsSync(jsonPath)) {
    console.error("Subscriber file not found at", jsonPath);
    return;
  }
  
  const data: ParsedSubscriber[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`Found ${data.length} subscribers to import\n`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const sub of data) {
    try {
      const existing = await db.select().from(subscribers).where(eq(subscribers.email, sub.email)).limit(1);
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      await db.insert(subscribers).values({
        email: sub.email,
        name: sub.name,
        status: "active",
        source: "import",
      });
      
      imported++;
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        skipped++;
      } else {
        console.error(`Error importing ${sub.email}:`, err.message);
        errors++;
      }
    }
  }
  
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped (duplicates): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
}

async function extractAndImportGuests() {
  console.log("\n========================================");
  console.log("EXTRACTING AND IMPORTING GUESTS");
  console.log("========================================\n");
  
  const allEpisodes = await db.select().from(episodes);
  console.log(`Found ${allEpisodes.length} episodes to analyze\n`);
  
  const guestMap = new Map<string, { 
    name: string;
    episodeIds: string[];
    titles: string[];
    descriptions: string[];
  }>();
  
  for (const ep of allEpisodes) {
    let guestNames: string[] = [];
    
    if (ep.guestName) {
      if (ep.guestName.includes("&")) {
        guestNames = ep.guestName.split("&").map(n => n.trim());
      } else if (ep.guestName.includes(",")) {
        guestNames = ep.guestName.split(",").map(n => n.trim());
      } else {
        guestNames = [ep.guestName.trim()];
      }
    }
    
    if (guestNames.length === 0 && ep.description) {
      const guestMatch = ep.description.match(/Guest\s*(?:\d+)?:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
      if (guestMatch) {
        for (const match of guestMatch) {
          const nameMatch = match.match(/Guest\s*(?:\d+)?:\s*(.+)/);
          if (nameMatch) {
            guestNames.push(nameMatch[1].trim());
          }
        }
      }
    }
    
    for (let name of guestNames) {
      name = name.replace(/!+$/, '').trim();
      
      if (name.length < 3 || name.length > 60) continue;
      if (name.toLowerCase().includes("latest talks")) continue;
      if (name.toLowerCase().includes("episode")) continue;
      if (/^\d+$/.test(name)) continue;
      
      const normalizedName = name.toLowerCase();
      
      if (guestMap.has(normalizedName)) {
        const existing = guestMap.get(normalizedName)!;
        if (!existing.episodeIds.includes(ep.id)) {
          existing.episodeIds.push(ep.id);
          existing.titles.push(ep.title);
          if (ep.description) existing.descriptions.push(ep.description);
        }
      } else {
        guestMap.set(normalizedName, {
          name,
          episodeIds: [ep.id],
          titles: [ep.title],
          descriptions: ep.description ? [ep.description] : [],
        });
      }
    }
  }
  
  console.log(`Found ${guestMap.size} unique guests\n`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const [, guestData] of guestMap) {
    try {
      const existing = await db.select().from(guests).where(eq(guests.name, guestData.name)).limit(1);
      
      if (existing.length > 0) {
        await db.update(guests)
          .set({ episodeIds: guestData.episodeIds })
          .where(eq(guests.id, existing[0].id));
        console.log(`🔄 Updated: ${guestData.name} (${guestData.episodeIds.length} episodes)`);
        skipped++;
        continue;
      }
      
      let bio = "";
      let title = "";
      let company = "";
      
      const desc = guestData.descriptions.join(" ");
      
      const ownerMatch = desc.match(/(?:owner|founder|ceo|president)\s+(?:of\s+)?([A-Z][A-Za-z\s]+?)(?:\.|,|$)/i);
      if (ownerMatch) {
        company = ownerMatch[1].trim();
        title = "Founder";
      }
      
      const rabbiMatch = guestData.name.match(/^(?:R['`]\s*|Rabbi\s+|Rav\s+)/i);
      if (rabbiMatch) {
        title = "Rabbi";
      }
      
      bio = `Featured guest on Latest Talks. Appeared in ${guestData.episodeIds.length} episode${guestData.episodeIds.length > 1 ? 's' : ''}.`;
      
      await db.insert(guests).values({
        name: guestData.name,
        title,
        company,
        bio,
        episodeIds: guestData.episodeIds,
        featured: guestData.episodeIds.length >= 2,
        status: "published",
      });
      
      console.log(`✅ Imported: ${guestData.name} (${guestData.episodeIds.length} episodes)`);
      imported++;
      
    } catch (err: any) {
      console.error(`❌ Error importing guest ${guestData.name}:`, err.message);
      errors++;
    }
  }
  
  console.log("\n----------------------------------------");
  console.log(`✅ New guests imported: ${imported}`);
  console.log(`🔄 Existing guests updated: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
}

async function main() {
  try {
    await importSubscribers();
    await extractAndImportGuests();
    
    console.log("\n========================================");
    console.log("IMPORT COMPLETE!");
    console.log("========================================\n");
    
    process.exit(0);
  } catch (err) {
    console.error("Import failed:", err);
    process.exit(1);
  }
}

main();
