import { sql } from "drizzle-orm"
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core"
import type { InferSelectModel } from "drizzle-orm"
import { session as sessionTable } from "./session"
import { topic } from "./topic"
import { dimension } from "./dimension"

export const submission = sqliteTable("submission", {
  id: text("id").primaryKey(),
  session_id: text("session_id").notNull().references(() => sessionTable.id),
  topic_id: text("topic_id").notNull().references(() => topic.id),
  dimension_id: text("dimension_id").notNull().references(() => dimension.id),
  score: integer("score").notNull(),
  note_md: text("note_md").default(""),
  submitted_at: text("submitted_at").default(sql`(current_timestamp)`),
}, (table) => ({
  uniqueSubmission: uniqueIndex("uq_submission").on(table.session_id, table.topic_id, table.dimension_id),
}))

export type Submission = InferSelectModel<typeof submission>

