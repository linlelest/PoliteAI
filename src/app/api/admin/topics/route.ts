import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { v4 as uuid } from "uuid"
import { eq, and } from "drizzle-orm"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { topic } from "@/lib/db/schema/topic"
import { verifyAuth } from "@/lib/auth/guard"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await initDb()
  const db = getDbSync()

  const { searchParams } = new URL(request.url)
  const aiModelId = searchParams.get("ai_model_id")
  const politenessLevel = searchParams.get("politeness_level")
  const isActive = searchParams.get("is_active")

  let conditions = []
  if (aiModelId) conditions.push(eq(topic.ai_model_id, aiModelId))
  if (politenessLevel) conditions.push(eq(topic.politeness_level, Number(politenessLevel)))
  if (isActive !== null) conditions.push(eq(topic.is_active, isActive === "true"))

  let rows
  if (conditions.length > 0) {
    rows = db.select().from(topic).where(and(...conditions)).orderBy(topic.created_at).all()
  } else {
    rows = db.select().from(topic).orderBy(topic.created_at).all()
  }

  return NextResponse.json(rows)
}

const createSchema = z.object({
  ai_model_id: z.string().uuid(),
  politeness_level: z.number().int().min(1).max(3),
  theme_cn: z.string().optional().default(""),
  theme_en: z.string().optional().default(""),
  content_md: z.string().min(1),
  content_md_en: z.string().optional().default(""),
})

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    await initDb()
    const db = getDbSync()

    db.insert(topic).values({
      id: uuid(),
      ai_model_id: parsed.data.ai_model_id,
      politeness_level: parsed.data.politeness_level,
      theme_cn: parsed.data.theme_cn ?? "",
      theme_en: parsed.data.theme_en ?? "",
      content_md: parsed.data.content_md,
      content_md_en: parsed.data.content_md_en ?? "",
      is_active: true,
    }).run()
    saveDb()

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Create topic error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}