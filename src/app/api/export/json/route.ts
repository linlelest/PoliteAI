import { NextRequest, NextResponse } from "next/server"
import { initDb, getDbSync } from "@/lib/db"
import { session } from "@/lib/db/schema/session"
import { submission } from "@/lib/db/schema/submission"
import { topic } from "@/lib/db/schema/topic"
import { aiModel } from "@/lib/db/schema/ai-model"
import { dimension } from "@/lib/db/schema/dimension"
import { eq } from "drizzle-orm"
import { verifyAuth } from "@/lib/auth/guard"
import { sanitizeExportData } from "@/lib/export/sanitize"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await initDb()
  const db = getDbSync()

  const sessions = db.select().from(session).all()
  const submissions = db.select().from(submission).all()
  const topics = db.select().from(topic).all()
  const models = db.select().from(aiModel).where(eq(aiModel.is_active, true)).all()
  const dims = db.select().from(dimension).where(eq(dimension.is_active, true)).all()

  const topicMap = new Map(topics.map((t) => [t.id, t]))
  const dimMap = new Map(dims.map((d) => [d.id, d]))

  const tree = []
  for (const model of models) {
    const modelTopicIds = new Set(topics.filter((t) => t.ai_model_id === model.id).map((t) => t.id))
    const modelSubs = submissions.filter((s) => modelTopicIds.has(s.topic_id))

    const levelMap = new Map<number, Map<string, number[]>>()
    for (const s of modelSubs) {
      const t = topicMap.get(s.topic_id)
      if (!t) continue
      if (!levelMap.has(t.politeness_level)) levelMap.set(t.politeness_level, new Map())
      const dimScores = levelMap.get(t.politeness_level)!
      if (!dimScores.has(s.dimension_id)) dimScores.set(s.dimension_id, [])
      dimScores.get(s.dimension_id)!.push(s.score)
    }

    const levels = []
    for (const [level, dimScores] of levelMap) {
      const dimensions = dims.map((d) => {
        const scores = dimScores.get(d.id) || []
        const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
        return { dimId: d.id, title: d.title_en || d.title_cn, avgScore: avg }
      }).filter((d) => d.avgScore > 0)
      if (dimensions.length > 0) levels.push({ level, dimensions })
    }
    if (levels.length > 0) tree.push({ ai_name: model.custom_name, levels })
  }

  const dimDistributions = dims.map((d) => {
    const dimSubs = submissions.filter((s) => s.dimension_id === d.id)
    const counts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
    for (const s of dimSubs) {
      if (s.score >= 1 && s.score <= 5) counts[String(s.score) as keyof typeof counts]++
    }
    return { dim_id: d.id, title_en: d.title_en, counts }
  })

  const uniqueRounds = new Set(sessions.map((s) => s.round_id)).size

  const data = {
    meta: { exported_at: new Date().toISOString(), format_version: "2.0" },
    summary: {
      total_users: sessions.length,
      total_submissions: submissions.length,
    },
    tree,
    dimension_distribution: dimDistributions,
  }

  const sanitized = sanitizeExportData(data)

  return NextResponse.json(sanitized)
}