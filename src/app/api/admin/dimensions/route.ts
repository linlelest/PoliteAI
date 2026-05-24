import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { v4 as uuid } from "uuid"
import { eq, desc } from "drizzle-orm"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { dimension } from "@/lib/db/schema/dimension"
import { verifyAuth } from "@/lib/auth/guard"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await initDb()
  const db = getDbSync()
  const dims = db.select().from(dimension).where(eq(dimension.is_active, true)).orderBy(dimension.sort_order).all()
  return NextResponse.json(dims)
}

const createSchema = z.object({
  title_cn: z.string().default(""),
  title_en: z.string().default(""),
  desc_cn: z.string().default(""),
  desc_en: z.string().default(""),
})

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await initDb()
  const db = getDbSync()

  const count = db.select().from(dimension).where(eq(dimension.is_active, true)).all().length
  if (count >= 10) {
    return NextResponse.json({ error: "最多支持10个维度" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const maxOrder = db.select().from(dimension).orderBy(desc(dimension.sort_order)).all()
    const nextOrder = maxOrder.length > 0 ? (maxOrder[0].sort_order ?? 0) + 1 : 0

    const id = uuid()
    db.insert(dimension).values({
      id,
      title_cn: parsed.data.title_cn || "新维度",
      title_en: parsed.data.title_en || "New Dimension",
      desc_cn: parsed.data.desc_cn || "",
      desc_en: parsed.data.desc_en || "",
      max_score: 5,
      sort_order: nextOrder,
      is_active: true,
    }).run()
    saveDb()

    return NextResponse.json({
      success: true,
      dimension: {
        id,
        title_cn: parsed.data.title_cn || "新维度",
        title_en: parsed.data.title_en || "New Dimension",
        desc_cn: parsed.data.desc_cn || "",
        desc_en: parsed.data.desc_en || "",
        max_score: 5,
        sort_order: nextOrder,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error("Create dimension error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}