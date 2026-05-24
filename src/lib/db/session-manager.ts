import { v4 as uuid } from "uuid"
import { initDb, getDbSync, saveDb } from "@/lib/db"
import { session } from "@/lib/db/schema/session"
import { eq } from "drizzle-orm"
import type { Session } from "@/lib/db/schema"

export async function createSession(
  fingerprint: string,
  ipHash: string,
  roundId: string
): Promise<string> {
  await initDb()
  const db = getDbSync()
  const id = uuid()

  db.insert(session).values({
    id,
    device_fingerprint: fingerprint,
    ip_hash: ipHash,
    round_id: roundId,
    status: "active",
  }).run()
  saveDb()

  return id
}

export async function getSession(sessionId: string): Promise<Session | null> {
  await initDb()
  const db = getDbSync()
  const results = db.select().from(session).where(eq(session.id, sessionId)).all()
  return results[0] || null
}

export async function updateSessionStatus(
  sessionId: string,
  status: "active" | "completed"
): Promise<void> {
  await initDb()
  const db = getDbSync()
  db.update(session)
    .set({ status, last_updated: new Date().toISOString() })
    .where(eq(session.id, sessionId))
    .run()
  saveDb()
}