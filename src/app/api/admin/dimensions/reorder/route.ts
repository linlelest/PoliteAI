import { NextRequest, NextResponse } from "next/server"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { dimension } from "@/lib/db/schema/dimension"
import { eq } from "drizzle-orm"
import { verifyAuth } from "@/lib/auth/guard"

export async function PATCH(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected array" }, { status: 400 })
    }

    await initDb()
    const db = getDbSync()

    for (const item of body) {
      if (typeof item.id !== "string" || typeof item.sort_order !== "number") continue
      db.update(dimension)
        .set({ sort_order: item.sort_order })
        .where(eq(dimension.id, item.id))
        .run()
    }
    saveDb()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}