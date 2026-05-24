"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersIcon, ClipboardListIcon, ActivityIcon } from "lucide-react"

interface SummaryData {
  totalSessions: number
  totalSubmissions: number
  totalRounds: number
  latestActivity: string
}

export function SummaryCards() {
  const t = useTranslations("admin.stats")
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats/summary")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardTitle className="h-4 w-20 animate-pulse rounded bg-muted" /></CardHeader>
            <CardContent><div className="h-8 w-16 animate-pulse rounded bg-muted" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const items = [
    { icon: UsersIcon, label: t("totalUsers"), value: data.totalSessions },
    { icon: ClipboardListIcon, label: t("totalRounds"), value: data.totalRounds },
    { icon: ActivityIcon, label: t("latestActivity"), value: data.latestActivity ? new Date(data.latestActivity).toLocaleDateString() : "-" },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}