import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { topic } from "@/lib/db/schema/topic"
import { verifyAuth } from "@/lib/auth/guard"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    if (body._action === "delete") {
      const { id } = await params
      await initDb()
      const db = getDbSync()
      db.delete(topic).where(eq(topic.id, id)).run()
      saveDb()
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Delete topic error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await initDb()
    const db = getDbSync()

    db.delete(topic).where(eq(topic.id, id)).run()
    saveDb()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete topic error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()

    await initDb()
    const db = getDbSync()

    const existing = db.select().from(topic).where(eq(topic.id, id)).all()
    if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updates: Record<string, unknown> = {}
    if (typeof body.ai_model_id === "string") updates.ai_model_id = body.ai_model_id
    if (typeof body.politeness_level === "number") updates.politeness_level = body.politeness_level
    if (typeof body.theme_cn === "string") updates.theme_cn = body.theme_cn
    if (typeof body.theme_en === "string") updates.theme_en = body.theme_en
    if (typeof body.content_md === "string") updates.content_md = body.content_md
    if (typeof body.content_md_en === "string") updates.content_md_en = body.content_md_en
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 })
    }

    db.update(topic).set(updates).where(eq(topic.id, id)).run()
    saveDb()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update topic error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}