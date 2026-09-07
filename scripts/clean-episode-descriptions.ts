import { db } from "../server/db";
import { episodes } from "../shared/schema";
import { eq } from "drizzle-orm";
import { stripHtmlToText } from "../shared/textUtils";

async function main() {
  const all = await db
    .select({ id: episodes.id, title: episodes.title, description: episodes.description })
    .from(episodes);

  let updated = 0;
  for (const ep of all) {
    if (!ep.description) continue;
    const cleaned = stripHtmlToText(ep.description);
    if (cleaned !== ep.description) {
      await db.update(episodes).set({ description: cleaned }).where(eq(episodes.id, ep.id));
      updated++;
      console.log(`Cleaned: ${ep.title}`);
    }
  }

  console.log(`Total episodes: ${all.length}, updated: ${updated}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
