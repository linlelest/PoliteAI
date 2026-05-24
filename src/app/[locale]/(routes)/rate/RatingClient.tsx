"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/user/ProgressBar"
import { AIOutputCard } from "@/components/user/AIOutputCard"
import { RatingGrid } from "@/components/user/RatingGrid"
import { DraftIndicator } from "@/components/user/DraftIndicator"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { saveLocalDraft, getLocalDraft, deleteLocalDraft } from "@/lib/client/drafts"
import { generateDeviceFingerprint } from "@/lib/utils/fingerprint"
import { GeometricBackground } from "@/components/shared/GeometricBackground"
import type { Dimension } from "@/lib/db/schema"

interface TopicItem {
  id: string
  theme_cn: string
  theme_en: string
  content_md: string
  content_md_en: string
  ai_model_id: string
  politeness_level: number
}

export function RatingClient({ dimensions }: { dimensions: Dimension[] }) {
  const t = useTranslations("rate")
  const router = useRouter()
  const locale = useLocale()

  const [topics, setTopics] = useState<TopicItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({})
  const [roundId, setRoundId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fpRef = useRef<string>("")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topicsRef = useRef<TopicItem[]>([])

  const saveDraft = useCallback(async (rid: string, idx: number, r: Record<string, Record<string, number>>) => {
    await saveLocalDraft(rid, { roundId: rid, currentIndex: idx, ratings: r, topics: topicsRef.current })
    setSaving(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => setSaving(false), 1000)
  }, [])

  const startNewRound = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fingerprint = fpRef.current || await generateDeviceFingerprint()
      fpRef.current = fingerprint

      const res = await fetch("/api/rate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint, locale }),
      })

      if (res.status === 429) {
        const err = await res.json()
        setError(err.message || t("rateLimit") || "今日上限已达")
        setLoading(false)
        return
      }

      if (res.status === 503) {
        const err = await res.json()
        setError(err.message || t("insufficientTopics") || "题库不足")
        setLoading(false)
        return
      }

      const data = await res.json()
      setTopics(data.topics)
      topicsRef.current = data.topics
      setRoundId(data.roundId)
      setCurrentIndex(0)
      setRatings({})
      localStorage.setItem("round_id", data.roundId)
      setLoading(false)
    } catch {
      setError("网络错误，请重试")
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    const init = async () => {
      const storedRoundId = localStorage.getItem("round_id")
      if (storedRoundId) {
        try {
          const draft = await getLocalDraft(storedRoundId)
          if (draft) {
            if (draft.topics && draft.topics.length > 0) {
              // Restore entirely from local draft — no Redis needed
              setTopics(draft.topics)
              topicsRef.current = draft.topics
              setRoundId(storedRoundId)
              setCurrentIndex(draft.currentIndex)
              setRatings(draft.ratings)
              setLoading(false)
              return
            }
            // Fallback to Redis for old drafts without topics
            const res = await fetch(`/api/rate/round/${storedRoundId}`)
            if (res.ok) {
              const data = await res.json()
              setTopics(data.topics)
              setRoundId(storedRoundId)
              setCurrentIndex(draft.currentIndex)
              setRatings(draft.ratings)
              setLoading(false)
              return
            }
          }
        } catch {
          // fall through to new round
        }
      }
      await startNewRound()
    }
    init()
  }, [startNewRound])

  useEffect(() => {
    if (roundId) {
      saveDraft(roundId, currentIndex, ratings)
    }
  }, [currentIndex, ratings, roundId, saveDraft])

  const handleRate = (dimId: string, score: number) => {
    const topicId = topics[currentIndex]?.id
    if (!topicId) return
    setRatings((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId], [dimId]: score },
    }))
  }

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < topics.length) {
      setCurrentIndex(idx)
    }
  }

  const allComplete = topics.length > 0 && topics.every((t) => {
    const r = ratings[t.id]
    return r && dimensions.every((d) => typeof r[d.id] === "number")
  })

  const handleSubmit = async () => {
    if (!allComplete || !roundId) return
    setSubmitting(true)
    try {
      const submissions: { topicId: string; dimensionId: string; score: number }[] = []
      for (const topicId of Object.keys(ratings)) {
        for (const [dimId, score] of Object.entries(ratings[topicId])) {
          submissions.push({ topicId, dimensionId: dimId, score })
        }
      }

      const res = await fetch("/api/rate/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, submissions }),
      })

      if (res.ok) {
        await deleteLocalDraft(roundId)
        localStorage.removeItem("round_id")
        router.push("/submit")
      } else {
        toast.error("提交失败，请重试")
      }
    } catch {
      toast.error("网络错误")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={startNewRound}>重试</Button>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">暂无题目</p>
      </div>
    )
  }

  const topic = topics[currentIndex]!
  const topicRatings = ratings[topic.id] || {}
  const currentComplete = dimensions.every((d) => typeof topicRatings[d.id] === "number")
  return (
    <div className="mx-auto min-h-screen max-w-2xl">
      <ProgressBar current={currentIndex + 1} total={topics.length} />
      <div className="space-y-6 p-4 pb-24">
        {/* Theme badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {topic.theme_cn && (
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {locale === "zh" ? topic.theme_cn : topic.theme_en || topic.theme_cn}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
        <AIOutputCard content={locale === "zh" ? topic.content_md : (topic.content_md_en || topic.content_md)} />

        <RatingGrid
          dimensions={dimensions}
          ratings={topicRatings}
          onRate={handleRate}
        />
      </div>
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between border-t bg-background px-4 py-3">
        <Button
          variant="outline"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          {t("previous")}
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {topics.length}
        </span>
        {currentIndex < topics.length - 1 ? (
          <Button onClick={() => goTo(currentIndex + 1)} disabled={!currentComplete}>
            {t("next")}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allComplete || submitting}
          >
            {submitting ? t("submitting") : t("submitButton")}
          </Button>
        )}
      </div>
      <DraftIndicator saving={saving} />
    </div>
  )
}