import { db } from "./db";
import { episodes } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as readline from "readline";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  duration: number;
  duration_string: string;
  view_count: number;
  thumbnails: Array<{ url: string; height: number; width: number }>;
  webpage_url: string;
}

function extractEpisodeNumber(title: string): number | null {
  const match = title.match(/#(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function cleanTitle(title: string): string {
  let cleaned = title;
  const prefixMatch = cleaned.match(/^Latest Talks\s*(Podcast\s*)?[-#]?\s*#?\d*\s*\|?\s*/i);
  if (prefixMatch) {
    cleaned = cleaned.substring(prefixMatch[0].length);
  }
  const epMatch = cleaned.match(/^Ep\s*#?\d+\s*\|?\s*/i);
  if (epMatch) {
    cleaned = cleaned.substring(epMatch[0].length);
  }
  return cleaned.trim() || title;
}

function extractGuestName(title: string, description: string): string | null {
  const titleGuestPatterns = [
    /(?:interview|conversation|chat|talk|speaking)\s+with\s+([^|–\-]+)/i,
    /featuring\s+([^|–\-]+)/i,
    /\|\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/,
    /–\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/,
  ];
  
  for (const pattern of titleGuestPatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const potentialName = match[1].trim();
      if (potentialName.split(/\s+/).length >= 2 && potentialName.length < 50) {
        return potentialName;
      }
    }
  }
  
  const descGuestPatterns = [
    /Guest\s*(?:\d+)?:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /(?:guest|featuring|with)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  ];
  
  for (const pattern of descGuestPatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const potentialName = match[1].trim();
      if (potentialName.split(/\s+/).length >= 2 && potentialName.length < 50) {
        return potentialName;
      }
    }
  }
  
  return null;
}

function determineEpisodeType(title: string, duration: number): "video" | "audio" {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("audio") || lowerTitle.includes("podcast audio")) {
    return "audio";
  }
  return "video";
}

function determineCategory(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();
  
  if (text.includes("torah") || text.includes("shiur") || text.includes("parsha") || text.includes("rebbe")) {
    return "torah";
  }
  if (text.includes("music") || text.includes("singer") || text.includes("album") || text.includes("concert")) {
    return "entertainment";
  }
  if (text.includes("business") || text.includes("entrepreneur") || text.includes("startup") || text.includes("money") || text.includes("investing")) {
    return "business";
  }
  if (text.includes("health") || text.includes("doctor") || text.includes("medical") || text.includes("wellness")) {
    return "lifestyle";
  }
  if (text.includes("interview") || text.includes("exclusive") || text.includes("story") || text.includes("journey")) {
    return "interviews";
  }
  
  return "general";
}

async function importVideos() {
  const jsonlPath = "/tmp/yt_videos.jsonl";
  
  if (!fs.existsSync(jsonlPath)) {
    console.error("Video data file not found. Run yt-dlp first.");
    process.exit(1);
  }
  
  const fileStream = fs.createReadStream(jsonlPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  console.log("Starting import from YouTube channel...\n");
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const video: YouTubeVideo = JSON.parse(line);
      const youtubeUrl = `https://www.youtube.com/watch?v=${video.id}`;
      
      const existing = await db.select().from(episodes).where(eq(episodes.youtubeUrl, youtubeUrl)).limit(1);
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipping (exists): ${video.title}`);
        skipped++;
        continue;
      }
      
      const episodeNumber = extractEpisodeNumber(video.title);
      const cleanedTitle = cleanTitle(video.title);
      const guestName = extractGuestName(video.title, video.description);
      const episodeType = determineEpisodeType(video.title, video.duration);
      const category = determineCategory(video.title, video.description);
      
      const thumbnailUrl = video.thumbnails?.length > 0 
        ? `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`
        : null;
      
      await db.insert(episodes).values({
        title: cleanedTitle,
        description: video.description || "",
        youtubeUrl,
        youtubeId: video.id,
        thumbnailUrl,
        type: episodeType,
        category,
        episodeNumber,
        guestName,
        status: "published",
        isPremium: false,
        label: "none",
      });
      
      console.log(`✅ Imported: ${cleanedTitle} ${episodeNumber ? `(#${episodeNumber})` : ""}`);
      imported++;
      
    } catch (err: any) {
      console.error(`❌ Error importing video: ${err.message}`);
      errors++;
    }
  }
  
  console.log("\n========================================");
  console.log(`Import complete!`);
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped (already exist): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log("========================================\n");
  
  process.exit(0);
}

importVideos().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
