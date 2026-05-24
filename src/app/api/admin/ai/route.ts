import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { v4 as uuid } from "uuid"
import { eq } from "drizzle-orm"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { aiModel } from "@/lib/db/schema/ai-model"
import { verifyAuth } from "@/lib/auth/guard"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await initDb()
  const db = getDbSync()
  const models = db.select().from(aiModel).orderBy(aiModel.created_at).all()
  return NextResponse.json(models)
}

const createSchema = z.object({
  custom_name: z.string().min(1).max(50),
})

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await initDb()
    const db = getDbSync()

    const existing = db.select().from(aiModel).where(eq(aiModel.custom_name, parsed.data.custom_name)).all()
    if (existing.length > 0) {
      return NextResponse.json({ error: "该名称已存在" }, { status: 409 })
    }

    const id = uuid()
    db.insert(aiModel).values({
      id,
      custom_name: parsed.data.custom_name,
      is_active: true,
    }).run()
    saveDb()

    return NextResponse.json({
      success: true,
      model: { id, custom_name: parsed.data.custom_name, is_active: true, created_at: new Date().toISOString() },
    }, { status: 201 })
  } catch (error) {
    console.error("Create AI error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}