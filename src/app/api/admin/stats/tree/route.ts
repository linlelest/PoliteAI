import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { initDb, getDbSync } from "@/lib/db"
import { submission } from "@/lib/db/schema/submission"
import { topic } from "@/lib/db/schema/topic"
import { aiModel } from "@/lib/db/schema/ai-model"
import { dimension } from "@/lib/db/schema/dimension"
import { verifyAuth } from "@/lib/auth/guard"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await initDb()
  const db = getDbSync()

  const models = db.select().from(aiModel).where(eq(aiModel.is_active, true)).all()
  const topics = db.select().from(topic).all()
  const dims = db.select().from(dimension).where(eq(dimension.is_active, true)).all()
  const subs = db.select().from(submission).all()

  const topicMap = new Map(topics.map((t) => [t.id, t]))
  const dimMap = new Map(dims.map((d) => [d.id, d]))

  // Build themeMap: theme → aiModel → level → dimScores
  const themeMap = new Map<string, Map<string, Map<number, Map<string, number[]>>>>()

  for (const t of topics) {
    const themeKey = t.theme_cn || t.theme_en || "未分类"
    if (!themeMap.has(themeKey)) themeMap.set(themeKey, new Map())
    const aiMap = themeMap.get(themeKey)!
    if (!aiMap.has(t.ai_model_id)) aiMap.set(t.ai_model_id, new Map())
    const levelMap = aiMap.get(t.ai_model_id)!
    if (!levelMap.has(t.politeness_level)) levelMap.set(t.politeness_level, new Map())
  }

  for (const s of subs) {
    const t = topicMap.get(s.topic_id); if (!t) continue
    const themeKey = t.theme_cn || t.theme_en || "未分类"
    const aiMap = themeMap.get(themeKey); if (!aiMap) continue
    const levelMap = aiMap.get(t.ai_model_id); if (!levelMap) continue
    const dimScores = levelMap.get(t.politeness_level); if (!dimScores) continue
    if (!dimScores.has(s.dimension_id)) dimScores.set(s.dimension_id, [])
    dimScores.get(s.dimension_id)!.push(s.score)
  }

  const result: any[] = []

  for (const [themeKey, aiMap] of themeMap) {
    const themeEntry: any = { theme_cn: themeKey, theme_en: "", ai_models: [] }

    for (const [modelId, levelMap] of aiMap) {
      const model = models.find((m) => m.id === modelId)
      if (!model) continue

      const aiEntry: any = { ai_name: model.custom_name, levels: [] }

      for (const [level, dimScores] of levelMap) {
        const allScores: number[] = []
        const dimensions = dims.map((d) => {
          const scores = dimScores.get(d.id) || []
          allScores.push(...scores)
          const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
          return { dimId: d.id, title_cn: d.title_cn, title_en: d.title_en, avgScore: avg, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
        }).filter((d) => d.avgScore > 0)

        // Fill counts
        for (const [dimId, scores] of dimScores) {
          const dim = dimensions.find((d) => d.dimId === dimId)
          if (dim) for (const sc of scores) { if (sc >= 1 && sc <= 5) (dim.counts as any)[String(sc)]++ }
        }

        const overallAvg = allScores.length > 0
          ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
          : 0

        aiEntry.levels.push({ level, overallAvg, dimensions })
      }

      if (aiEntry.levels.length > 0) themeEntry.ai_models.push(aiEntry)
    }

    if (themeEntry.ai_models.length > 0) result.push(themeEntry)
  }

  return NextResponse.json(result)
}