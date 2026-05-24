import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { v4 as uuid } from "uuid"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { submission } from "@/lib/db/schema/submission"
import { session } from "@/lib/db/schema/session"
import { deleteDraft } from "@/lib/redis/drafts"
import { decrementRateLimit } from "@/lib/redis/rate-limit"
import crypto from "crypto"

const submitSchema = z.object({
  roundId: z.string().uuid(),
  sessionId: z.string().optional(),
  submissions: z.array(z.object({
    topicId: z.string(),
    dimensionId: z.string(),
    score: z.number().int().min(1).max(5),
  })),
})

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1"
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { roundId, sessionId: existingSessionId, submissions } = parsed.data

    await initDb()
    const db = getDbSync()

    const ip = getClientIp(request)
    const ipHash = hashIp(ip)

    const sessionId = existingSessionId || uuid()

    if (!existingSessionId) {
      db.insert(session).values({
        id: sessionId,
        device_fingerprint: "unknown",
        ip_hash: ipHash,
        round_id: roundId,
        status: "completed",
      }).run()
    }

    const values = submissions.map((s) => ({
      id: uuid(),
      session_id: sessionId,
      topic_id: s.topicId,
      dimension_id: s.dimensionId,
      score: s.score,
      note_md: "",
    }))

    for (const v of values) {
      db.insert(submission).values(v).run()
    }

    saveDb()

    await deleteDraft(roundId)
    await decrementRateLimit(ip)

    return NextResponse.json({ success: true, sessionId })
  } catch (error) {
    console.error("Submit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}