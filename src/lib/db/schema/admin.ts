import { sql } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import type { InferSelectModel } from "drizzle-orm"

export const admin = sqliteTable("admin", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  is_initialized: integer("is_initialized", { mode: "boolean" }).default(false),
  created_at: text("created_at").default(sql`(current_timestamp)`),
})

export type Admin = InferSelectModel<typeof admin>

