import { NextRequest, NextResponse } from "next/server"
import { eq, and, sql } from "drizzle-orm"
import { initDb, getDbSync } from "@/lib/db"
import { submission } from "@/lib/db/schema/submission"
import { topic } from "@/lib/db/schema/topic"
import { verifyAuth } from "@/lib/auth/guard"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dimId: string }> }
) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { dimId } = await params
  const { searchParams } = new URL(request.url)
  const aiModelId = searchParams.get("ai_model_id")
  const politenessLevel = searchParams.get("politeness_level")

  await initDb()
  const db = getDbSync()

  const subs = db.select().from(submission).all()

  let filtered = subs.filter((s) => s.dimension_id === dimId)

  if (aiModelId) {
    const topics = db.select().from(topic).where(eq(topic.ai_model_id, aiModelId)).all()
    const topicIds = new Set(topics.map((t) => t.id))
    filtered = filtered.filter((s) => topicIds.has(s.topic_id))
  }

  if (politenessLevel) {
    const topics = db.select().from(topic).where(eq(topic.politeness_level, Number(politenessLevel))).all()
    const topicIds = new Set(topics.map((t) => t.id))
    filtered = filtered.filter((s) => topicIds.has(s.topic_id))
  }

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const s of filtered) {
    const score = s.score as 1 | 2 | 3 | 4 | 5
    if (counts[score] !== undefined) counts[score]++
  }

  return NextResponse.json(counts)
}