import { initDb, getDbSync } from "@/lib/db"
import { dimension } from "@/lib/db/schema/dimension"
import { eq } from "drizzle-orm"
import { DimensionsClient } from "./DimensionsClient"

export default async function DimensionsPage() {
  await initDb()
  const db = getDbSync()
  const dims = db.select().from(dimension).where(eq(dimension.is_active, true)).orderBy(dimension.sort_order).all()

  const serialized = dims.map((d) => ({
    id: d.id,
    title_cn: d.title_cn,
    title_en: d.title_en,
    desc_cn: d.desc_cn,
    desc_en: d.desc_en,
    max_score: d.max_score ?? 5,
    sort_order: d.sort_order ?? 0,
    is_active: d.is_active ?? true,
    created_at: d.created_at ?? "",
  }))

  return <DimensionsClient dimensions={serialized} />
}