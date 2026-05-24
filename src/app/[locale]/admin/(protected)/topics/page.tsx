import { initDb, getDbSync } from "@/lib/db"
import { topic } from "@/lib/db/schema/topic"
import { aiModel } from "@/lib/db/schema/ai-model"
import { eq } from "drizzle-orm"
import { TopicsListClient } from "./TopicsListClient"

export default async function TopicsPage() {
  await initDb()
  const db = getDbSync()

  const models = db.select().from(aiModel).orderBy(aiModel.custom_name).all()
  const modelMap = new Map(models.map((m) => [m.id, m.custom_name]))

  const topics = db.select().from(topic).orderBy(topic.created_at).all()

  const serialized = topics.map((t) => ({
    id: t.id,
    ai_model_id: t.ai_model_id,
    ai_model_name: modelMap.get(t.ai_model_id) ?? "未知",
    politeness_level: t.politeness_level,
    theme_cn: t.theme_cn ?? "",
    theme_en: t.theme_en ?? "",
    content_md: t.content_md,
    content_md_en: t.content_md_en ?? "",
    is_active: t.is_active ?? true,
    created_at: t.created_at ?? "",
  }))

  const serializedModels = models.map((m) => ({
    id: m.id,
    custom_name: m.custom_name,
  }))

  return <TopicsListClient topics={serialized} models={serializedModels} />
}