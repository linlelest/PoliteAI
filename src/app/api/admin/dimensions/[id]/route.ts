import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { dimension } from "@/lib/db/schema/dimension"
import { verifyAuth } from "@/lib/auth/guard"

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

    const existing = db.select().from(dimension).where(eq(dimension.id, id)).all()
    if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updates: Record<string, unknown> = {}
    if (typeof body.title_cn === "string") updates.title_cn = body.title_cn
    if (typeof body.title_en === "string") updates.title_en = body.title_en
    if (typeof body.desc_cn === "string") updates.desc_cn = body.desc_cn
    if (typeof body.desc_en === "string") updates.desc_en = body.desc_en
    if (typeof body.max_score === "number") updates.max_score = body.max_score
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 })
    }

    db.update(dimension).set(updates).where(eq(dimension.id, id)).run()
    saveDb()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update dimension error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}