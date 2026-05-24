import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { initDb, getDbSync } from "@/lib/db"
import { admin } from "@/lib/db/schema/admin"
import { verifyPassword } from "@/lib/auth/password"
import { setSessionCookie } from "@/lib/auth/session"
import { redis } from "@/lib/redis"

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1"
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const blockKey = `login:block:${ip}`
    const blockCount = await redis.get<number>(blockKey)

    if (blockCount && blockCount >= 5) {
      const ttl = await redis.ttl(blockKey)
      return NextResponse.json({ error: "Too many attempts", retryAfter: ttl }, { status: 429 })
    }

    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await initDb()
    const db = getDbSync()

    const { username, password } = parsed.data
    const users = db.select().from(admin).where(eq(admin.username, username)).all()

    if (users.length === 0) {
      await redis.incr(blockKey); await redis.expire(blockKey, 900)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]
    const valid = await verifyPassword(password, user.password_hash)

    if (!valid) {
      await redis.incr(blockKey); await redis.expire(blockKey, 900)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    await redis.del(blockKey)

    const response = NextResponse.json({ success: true }, { status: 200 })
    response.headers.set("Set-Cookie", setSessionCookie(username))
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}