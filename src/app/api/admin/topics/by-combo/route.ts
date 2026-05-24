import { NextRequest, NextResponse } from "next/server"
import { initDb, getDbSync } from "@/lib/db"
import { topic } from "@/lib/db/schema/topic"
import { eq, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const themeCn = searchParams.get("theme_cn") ?? ""
  const themeEn = searchParams.get("theme_en") ?? ""
  const aiModelId = searchParams.get("ai_model_id")

  if (!aiModelId) {
    return NextResponse.json({ error: "ai_model_id is required" }, { status: 400 })
  }

  await initDb()
  const db = getDbSync()

  const where = and(
    eq(topic.ai_model_id, aiModelId),
    eq(topic.is_active, true),
  ) as any

  const rows = db.select().from(topic).where(where).all()

  // Filter by theme_cn or theme_en
  const filtered = rows.filter((t: any) => {
    if (themeCn && t.theme_cn !== themeCn) return false
    if (themeEn && t.theme_en !== themeEn) return false
    return true
  })

  const result = filtered.map((t: any) => ({
    id: t.id,
    politeness_level: t.politeness_level,
    content_md: t.content_md ?? "",
    content_md_en: t.content_md_en ?? "",
  }))

  return NextResponse.json(result)
}