import { sql } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import type { InferSelectModel } from "drizzle-orm"

export const dimension = sqliteTable("dimension", {
  id: text("id").primaryKey(),
  title_cn: text("title_cn").notNull(),
  title_en: text("title_en").notNull(),
  desc_cn: text("desc_cn").notNull().default(""),
  desc_en: text("desc_en").notNull().default(""),
  max_score: integer("max_score").default(5),
  sort_order: integer("sort_order").default(0),
  is_active: integer("is_active", { mode: "boolean" }).default(true),
  created_at: text("created_at").default(sql`(current_timestamp)`),
})

export type Dimension = InferSelectModel<typeof dimension>

