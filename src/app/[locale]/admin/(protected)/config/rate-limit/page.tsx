"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

export default function RateLimitConfigPage() {
  const t = useTranslations("admin.config")
  const [maxRounds, setMaxRounds] = useState("5")
  const [topicsPerRound, setTopicsPerRound] = useState("5")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/config/rate-limit")
      .then((r) => r.json())
      .then((d) => {
        setMaxRounds(String(d.maxRounds ?? 5))
        setTopicsPerRound(String(d.topicsPerRound ?? 5))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    const mr = parseInt(maxRounds, 10)
    const tpr = parseInt(topicsPerRound, 10)
    if (isNaN(mr) || mr < 1 || mr > 100) { toast.error(t("saveFailed")); return }
    if (isNaN(tpr) || tpr < 1 || tpr > 100) { toast.error(t("saveFailed")); return }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/config/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxRounds: mr, topicsPerRound: tpr }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(t("saved", { rounds: data.maxRounds, topics: data.topicsPerRound }))
      } else toast.error(t("saveFailed"))
    } catch { toast.error(t("networkError")) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="h-32 animate-pulse rounded-lg bg-muted" />

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-bold">{t("rateLimit")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("rateLimitTitle")}</CardTitle>
          <CardDescription>{t("rateLimitDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("maxRounds")}</Label>
            <Input type="number" min={1} max={100} value={maxRounds} onChange={(e) => setMaxRounds(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("topicsPerRound")}</Label>
            <Input type="number" min={1} max={100} value={topicsPerRound} onChange={(e) => setTopicsPerRound(e.target.value)} />
            <p className="text-xs text-muted-foreground">{t("topicsPerRoundHint")}</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
        </CardContent>
      </Card>
    </div>
  )
}