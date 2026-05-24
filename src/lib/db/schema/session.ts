import { sql } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import type { InferSelectModel } from "drizzle-orm"

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  device_fingerprint: text("device_fingerprint").notNull(),
  ip_hash: text("ip_hash").notNull(),
  round_id: text("round_id").notNull(),
  status: text("status").default("active"),
  last_updated: text("last_updated").default(sql`(current_timestamp)`),
})

export type Session = InferSelectModel<typeof session>

