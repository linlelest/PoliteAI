import { NextResponse } from "next/server"
import { getRound } from "@/lib/redis/drafts"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params
  const topics = await getRound(roundId)
  if (!topics) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 })
  }

  const safeTopics = topics.map((t: any) => ({
    id: t.id,
    theme_cn: t.theme_cn ?? "",
    theme_en: t.theme_en ?? "",
    content_md: t.content_md ?? "",
    content_md_en: t.content_md_en ?? "",
    ai_model_id: t.ai_model_id,
    politeness_level: t.politeness_level,
  }))

  return NextResponse.json({ topics: safeTopics })
}