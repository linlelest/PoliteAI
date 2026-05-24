import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { v4 as uuid } from "uuid"
import { eq } from "drizzle-orm"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { admin } from "@/lib/db/schema/admin"
import { hashPassword } from "@/lib/auth/password"
import { setSessionCookie } from "@/lib/auth/session"

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    await initDb()
    const db = getDbSync()

    const existing = db.select().from(admin).where(eq(admin.is_initialized, true)).all()
    if (existing.length > 0) {
      return NextResponse.json({ error: "Already initialized" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { username, password } = parsed.data
    const password_hash = await hashPassword(password)

    db.insert(admin).values({
      id: uuid(),
      username,
      password_hash,
      is_initialized: true,
    }).run()
    saveDb()

    const response = NextResponse.json({ success: true }, { status: 200 })
    response.headers.set("Set-Cookie", setSessionCookie(username))
    return response
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}