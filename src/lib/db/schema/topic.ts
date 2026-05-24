import { sql } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import type { InferSelectModel } from "drizzle-orm"
import { aiModel } from "./ai-model"

export const topic = sqliteTable("topic", {
  id: text("id").primaryKey(),
  ai_model_id: text("ai_model_id").notNull().references(() => aiModel.id),
  politeness_level: integer("politeness_level").notNull(),
  theme_cn: text("theme_cn").notNull().default(""),
  theme_en: text("theme_en").notNull().default(""),
  content_md: text("content_md").notNull().default(""),
  content_md_en: text("content_md_en").notNull().default(""),
  is_active: integer("is_active", { mode: "boolean" }).default(true),
  created_at: text("created_at").default(sql`(current_timestamp)`),
})

export type Topic = InferSelectModel<typeof topic>