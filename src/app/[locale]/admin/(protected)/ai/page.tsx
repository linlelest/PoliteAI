import { initDb, getDbSync } from "@/lib/db"
import { aiModel } from "@/lib/db/schema/ai-model"
import { eq } from "drizzle-orm"
import { AIListClient } from "./AIListClient"

export default async function AIPage() {
  await initDb()
  const db = getDbSync()
  const models = db.select().from(aiModel).orderBy(aiModel.created_at).all()

  const serialized = models.map((m) => ({
    id: m.id,
    custom_name: m.custom_name,
    is_active: m.is_active ?? true,
    created_at: m.created_at ?? "",
  }))

  return <AIListClient models={serialized} />
}