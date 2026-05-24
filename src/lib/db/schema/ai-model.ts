import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"

export const aiModel = sqliteTable("ai_model", {
  id: text("id").primaryKey(),
  custom_name: text("custom_name").unique().notNull(),
  is_active: integer("is_active", { mode: "boolean" }).default(true),
  created_at: text("created_at").default(sql`(current_timestamp)`),
})

export type AiModel = InferSelectModel<typeof aiModel>
