import { NextRequest, NextResponse } from "next/server"
import { eq, inArray } from "drizzle-orm"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { aiModel } from "@/lib/db/schema/ai-model"
import { topic } from "@/lib/db/schema/topic"
import { submission } from "@/lib/db/schema/submission"
import { verifyAuth } from "@/lib/auth/guard"

async function getAuth(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await getAuth(request)
  if (authErr) return authErr

  try {
    const { id } = await params
    await initDb()
    const db = getDbSync()

    const existing = db.select().from(aiModel).where(eq(aiModel.id, id)).all()
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Get topic IDs for this AI
    const topics = db.select({ id: topic.id }).from(topic).where(eq(topic.ai_model_id, id)).all()
    const topicIds = topics.map(t => t.id)

    // Delete related data in order (handles FK constraints)
    if (topicIds.length > 0) {
      db.delete(submission).where(inArray(submission.topic_id, topicIds)).run()
    }
    db.delete(topic).where(eq(topic.ai_model_id, id)).run()
    db.delete(aiModel).where(eq(aiModel.id, id)).run()
    saveDb()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete AI error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await getAuth(request)
  if (authErr) return authErr

  try {
    const { id } = await params
    const body = await request.json()

    await initDb()
    const db = getDbSync()

    const existing = db.select().from(aiModel).where(eq(aiModel.id, id)).all()
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}

    if (typeof body.custom_name === "string") {
      const dup = db.select().from(aiModel).where(
        eq(aiModel.custom_name, body.custom_name)
      ).all()
      if (dup.length > 0 && dup[0].id !== id) {
        return NextResponse.json({ error: "该名称已存在" }, { status: 409 })
      }
      updates.custom_name = body.custom_name
    }

    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    db.update(aiModel).set(updates).where(eq(aiModel.id, id)).run()
    saveDb()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update AI error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}