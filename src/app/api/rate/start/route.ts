import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/redis/rate-limit"
import { generateRound } from "@/lib/engine/distribution"
import { saveRound } from "@/lib/redis/drafts"
import { getSeenTopicIds, markSeenTopics, clearSeenTopics } from "@/lib/redis/drafts"
import crypto from "crypto"

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1"
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    const rateLimit = await checkRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: "rate_limit",
        message: "已达到今日评分上限，请明天再来",
        remaining: rateLimit.remaining,
        resetAtMs: rateLimit.resetAtMs,
      }, { status: 429 })
    }

    const body = await request.json()
    const fingerprint = body.fingerprint as string | undefined
    const locale = (body.locale as string) || "zh"

    let excludeTopics: string[] = []
    if (fingerprint) {
      excludeTopics = await getSeenTopicIds(fingerprint, locale)
    }

    let result = await generateRound(locale, excludeTopics)

    // If no unseen topics left, clear seen list and retry
    if (result.error && fingerprint && excludeTopics.length > 0) {
      await clearSeenTopics(fingerprint, locale)
      result = await generateRound(locale, [])
    }

    if (result.error) {
      return NextResponse.json({
        error: "insufficient_topics",
        message: result.error,
      }, { status: 503 })
    }

    await saveRound(result.roundId, result.topics)

    if (fingerprint) {
      await markSeenTopics(fingerprint, result.topics.map((t) => t.id), locale)
    }

    const safeTopics = result.topics.map((t) => ({
      id: t.id,
      theme_cn: (t as any).theme_cn ?? "",
      theme_en: (t as any).theme_en ?? "",
      content_md: t.content_md,
      content_md_en: (t as any).content_md_en ?? "",
      ai_model_id: t.ai_model_id,
      politeness_level: t.politeness_level,
    }))

    return NextResponse.json({
      roundId: result.roundId,
      topics: safeTopics,
    })
  } catch (error) {
    console.error("Rate start error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
