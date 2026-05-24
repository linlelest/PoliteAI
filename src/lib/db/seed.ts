import { initDb, saveDb, getDbSync } from "@/lib/db"
import { dimension } from "@/lib/db/schema/dimension"
import { v4 as uuid } from "uuid"
import { eq } from "drizzle-orm"

const defaultDimensions = [
  { title_cn: "可读性", title_en: "Readability", desc_cn: "文本是否流畅易懂", desc_en: "How fluent and easy to understand the text is" },
  { title_cn: "准确性", title_en: "Accuracy", desc_cn: "信息是否准确无误", desc_en: "Whether the information is accurate and error-free" },
  { title_cn: "自然度", title_en: "Naturalness", desc_cn: "表达是否自然不机械", desc_en: "Whether the expression feels natural, not robotic" },
  { title_cn: "礼貌度", title_en: "Politeness", desc_cn: "语气是否尊重得体", desc_en: "Whether the tone is respectful and appropriate" },
  { title_cn: "完整性", title_en: "Completeness", desc_cn: "回答是否完整全面", desc_en: "Whether the response is complete and thorough" },
]

async function main() {
  await initDb()
  const db = getDbSync()

  const existing = db.select().from(dimension).where(eq(dimension.is_active, true)).all()

  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing dimensions, skipping seed.`)
    return
  }

  for (let i = 0; i < defaultDimensions.length; i++) {
    const d = defaultDimensions[i]
    db.insert(dimension).values({
      id: uuid(),
      title_cn: d.title_cn,
      title_en: d.title_en,
      desc_cn: d.desc_cn,
      desc_en: d.desc_en,
      max_score: 5,
      sort_order: i,
      is_active: true,
    }).run()
  }

  saveDb()
  console.log(`Seeded ${defaultDimensions.length} default dimensions.`)
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})