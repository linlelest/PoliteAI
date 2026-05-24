import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { initDb, getDbSync } = await import("@/lib/db")
    const { admin } = await import("@/lib/db/schema/admin")
    const { eq } = await import("drizzle-orm")

    await initDb()
    const db = getDbSync()
    const existing = db.select().from(admin).where(eq(admin.is_initialized, true)).all()
    return NextResponse.json({ initialized: existing.length > 0 })
  } catch (error) {
    console.error("check-init error (DB not ready):", error)
    return NextResponse.json({ initialized: false })
  }
}