import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { submission } from "@/lib/db/schema/submission"

const notesSchema = z.object({
  sessionId: z.string(),
  topicId: z.string(),
  dimensionId: z.string(),
  note_md: z.string().max(500),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = notesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { sessionId, topicId, dimensionId, note_md } = parsed.data

    await initDb()
    const db = getDbSync()

    db.update(submission)
      .set({ note_md })
      .where(
        and(
          eq(submission.session_id, sessionId),
          eq(submission.topic_id, topicId),
          eq(submission.dimension_id, dimensionId)
        )
      )
      .run()

    saveDb()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notes update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}