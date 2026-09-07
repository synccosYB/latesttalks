---
name: DB schema drift and db:push
description: Why db:push used to hang/prompt, and how the drift was resolved
---

The dev database has legacy columns that must stay in `shared/schema.ts` even though new code doesn't write them:
- `episodes`: `guest_name`, `guest_contact`, `guest_email`, `host_name`, `guest_2_name`, `guest_3_name` (denormalized guest fields, replaced by `guestId`/`guest2Id`/`guest3Id`/`hostId`)
- `guests`: `episode_ids` (text array, replaced by episode→guest FK linkage)

**Why:** These columns hold real production data (87 episodes). If they are removed from the Drizzle schema, `npm run db:push` prompts interactively to drop them (data loss) and hangs any non-interactive runner such as the post-merge setup script.

**How to apply:** Never delete these legacy columns from the schema unless the data has been migrated and the user approved dropping them. Also, unique constraints must use Drizzle's naming convention (`<table>_<column>_unique`) — a mismatched constraint name (e.g. `platform_users_email_key`) makes db:push prompt forever; fix with `ALTER TABLE ... RENAME CONSTRAINT`.

Post-merge script (`scripts/post-merge.sh`) runs `npm install && npm run db:push` with stdin closed and a 120s timeout; it only works while db:push has zero pending prompts.
