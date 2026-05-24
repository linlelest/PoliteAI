import { redis } from "@/lib/redis"

interface RoundTopic {
  id: string
  ai_model_id: string
  politeness_level: number
  content_md: string
  content_md_en: string
  theme_cn: string
  theme_en: string
}

export interface DraftData {
  currentIndex: number
  ratings: Record<string, Record<string, number>>
}

const DRAFT_TTL = 3600
const ROUND_TTL = 3600

export async function saveDraft(roundId: string, data: DraftData): Promise<void> {
  await redis.set(`draft:${roundId}`, JSON.stringify(data), { ex: DRAFT_TTL })
}

export async function getDraft(roundId: string): Promise<DraftData | null> {
  const raw = await redis.get<string>(`draft:${roundId}`)
  if (!raw) return null
  await redis.expire(`draft:${roundId}`, DRAFT_TTL)
  return JSON.parse(raw)
}

export async function deleteDraft(roundId: string): Promise<void> {
  await redis.del(`draft:${roundId}`)
}

export async function saveRound(roundId: string, topics: { id: string; ai_model_id: string; politeness_level: number; content_md: string; content_md_en: string; theme_cn: string; theme_en: string }[]): Promise<void> {
  const safe = topics.map(({ id, ai_model_id, politeness_level, content_md, content_md_en, theme_cn, theme_en }) => ({
    id, ai_model_id, politeness_level, content_md, content_md_en, theme_cn, theme_en,
  }))
  await redis.set(`round:${roundId}`, JSON.stringify(safe), { ex: ROUND_TTL })
}

export async function getRound(roundId: string): Promise<RoundTopic[] | null> {
  const raw = await redis.get<string>(`round:${roundId}`)
  if (!raw) return null
  await redis.expire(`round:${roundId}`, ROUND_TTL)
  return JSON.parse(raw)
}

const SEEN_TTL = 86400

export async function markSeenTopics(fp: string, topicIds: string[], locale?: string): Promise<void> {
  const key = `seen:${fp}:${locale || "zh"}`
  if (topicIds.length > 0) {
    await redis.sadd(key, topicIds[0], ...topicIds.slice(1))
  }
  await redis.expire(key, SEEN_TTL)
}

export async function getSeenTopicIds(fp: string, locale?: string): Promise<string[]> {
  const key = `seen:${fp}:${locale || "zh"}`
  return redis.smembers(key)
}

export async function clearSeenTopics(fp: string, locale?: string): Promise<void> {
  await redis.del(`seen:${fp}:${locale || "zh"}`)
}