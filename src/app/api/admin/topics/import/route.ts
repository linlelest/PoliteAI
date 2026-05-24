import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { v4 as uuid } from "uuid"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { topic } from "@/lib/db/schema/topic"
import { verifyAuth } from "@/lib/auth/guard"

const importItemSchema = z.object({
  ai_model_id: z.string(),
  politeness_level: z.number().int().min(1).max(3),
  content_md: z.string().min(1),
})

const importSchema = z.array(importItemSchema)

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = importSchema.safeParse(body)

    if (!parsed.success) {
      const issues = (parsed.error as any).issues ?? (parsed.error as any).errors ?? []
      const errors = issues.map((e: any) => ({
        path: (e.path ?? []).join("."),
        message: e.message,
      }))
      return NextResponse.json({ created: 0, failed: errors.length, errors }, { status: 400 })
    }

    await initDb()
    const db = getDbSync()

    let created = 0
    for (const item of parsed.data) {
      try {
        db.insert(topic).values({
          id: uuid(),
          ai_model_id: item.ai_model_id,
          politeness_level: item.politeness_level,
          content_md: item.content_md,
          is_active: true,
        }).run()
        created++
      } catch {
        // skip individual failures
      }
    }
    saveDb()

    return NextResponse.json({ created, failed: parsed.data.length - created, errors: [] })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 })
  }
}