import { NextRequest, NextResponse } from "next/server"
import { initDb, getDbSync } from "@/lib/db"
import { session } from "@/lib/db/schema/session"
import { submission } from "@/lib/db/schema/submission"
import { verifyAuth } from "@/lib/auth/guard"
import { sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await initDb()
  const db = getDbSync()

  const totalSessions = db.select().from(session).all().length

  const totalSubmissions = db.select().from(submission).all().length

  const rounds = db.select().from(session).all()
  const uniqueRounds = new Set(rounds.map((s) => s.round_id)).size

  const latestActivity = rounds.reduce((latest, s) => {
    return s.last_updated && s.last_updated > latest ? s.last_updated : latest
  }, "")

  return NextResponse.json({
    totalSessions,
    totalSubmissions,
    totalRounds: uniqueRounds,
    latestActivity,
  })
}