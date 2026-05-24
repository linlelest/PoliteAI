import { v4 as uuid } from "uuid"
import { initDb, getDbSync } from "@/lib/db"
import { topic } from "@/lib/db/schema/topic"
import { submission } from "@/lib/db/schema/submission"
import { eq, sql } from "drizzle-orm"
import { getRateLimitConfig } from "@/lib/redis/rate-limit"
import type { Topic } from "@/lib/db/schema"

export function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function getTopicEvalCounts(): Map<string, number> {
  const db = getDbSync()
  try {
    const rows = db.select({
      topicId: submission.topic_id,
      cnt: sql<number>`COUNT(*)`,
    }).from(submission).groupBy(submission.topic_id).all()
    const map = new Map<string, number>()
    for (const r of rows) {
      map.set(r.topicId, r.cnt ?? 0)
    }
    return map
  } catch {
    return new Map()
  }
}

export async function generateRound(
  locale: string = "zh",
  excludeTopicIds: string[] = []
): Promise<{ topics: Topic[]; roundId: string; error?: string }> {
  await initDb()
  const db = getDbSync()

  const { topicsPerRound: maxTopicsPerRound } = await getRateLimitConfig()

  const allTopics = db.select({
    id: topic.id,
    ai_model_id: topic.ai_model_id,
    politeness_level: topic.politeness_level,
    theme_cn: topic.theme_cn,
    theme_en: topic.theme_en,
    content_md: topic.content_md,
    content_md_en: topic.content_md_en,
    is_active: topic.is_active,
    created_at: topic.created_at,
  }).from(topic).where(eq(topic.is_active, true) as any).all()

  // Filter by language: zh users only get topics with Chinese content,
  // en users only get topics with English content
  const langFiltered = allTopics.filter((t) => {
    if (locale === "en") {
      return t.content_md_en && t.content_md_en.trim() !== "" && t.content_md_en !== "<p></p>"
    }
    // Default to zh
    return t.content_md && t.content_md.trim() !== "" && t.content_md !== "<p></p>"
  })

  let filtered = excludeTopicIds.length > 0
    ? langFiltered.filter((t) => !excludeTopicIds.includes(t.id))
    : langFiltered

  if (filtered.length === 0) {
    return { topics: [], roundId: "", error: "No unseen topics available." }
  }

  const evalCounts = getTopicEvalCounts()

  // Sort by evaluation count ascending (least-rated first)
  filtered.sort((a, b) => {
    const aCount = evalCounts.get(a.id) ?? 0
    const bCount = evalCounts.get(b.id) ?? 0
    return aCount - bCount
  })

  // Randomly pick 1 to maxTopicsPerRound topics (not exactly maxTopicsPerRound)
  const pickCount = Math.min(
    Math.floor(Math.random() * maxTopicsPerRound) + 1,
    filtered.length
  )
  const selected = filtered.slice(0, pickCount)

  const shuffled = fisherYatesShuffle(selected as Topic[])

  return { topics: shuffled, roundId: uuid() }
}
