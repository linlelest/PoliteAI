import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { initDb, getDbSync } from "@/lib/db"
import { topic } from "@/lib/db/schema/topic"
import { verifyAuth } from "@/lib/auth/guard"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await initDb()
  const db = getDbSync()

  const topics = db.select().from(topic).where(eq(topic.is_active, true)).all()

  const data = {
    exported_at: new Date().toISOString(),
    version: "1.0",
    topics: topics.map((t) => ({
      id: t.id,
      ai_model_id: t.ai_model_id,
      politeness_level: t.politeness_level,
      content_md: t.content_md,
    })),
  }

  return NextResponse.json(data)
}