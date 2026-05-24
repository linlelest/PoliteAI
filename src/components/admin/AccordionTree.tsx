"use client"

import { useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { StarDistributionChart } from "./StarDistributionChart"
import { ChevronRightIcon, ChevronDownIcon } from "lucide-react"

interface DimData {
  dimId: string
  title_cn: string
  title_en: string
  avgScore: number
  counts: Record<string, number>
}

interface LevelData {
  level: number
  overallAvg: number
  dimensions: DimData[]
}

interface AiModelData {
  ai_name: string
  levels: LevelData[]
}

interface ThemeData {
  theme_cn: string
  ai_models: AiModelData[]
}

const levelColors: Record<number, string> = {
  1: "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800",
  2: "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800",
  3: "border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800",
}

const levelLabels: Record<number, string> = { 1: "L1", 2: "L2", 3: "L3" }

export function AccordionTree() {
  const t = useTranslations("admin.stats")
  const locale = useLocale()
  const [tree, setTree] = useState<ThemeData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null)
  const [expandedModel, setExpandedModel] = useState<string | null>(null)
  const [expandedLevel, setExpandedLevel] = useState<{ model: string; level: number } | null>(null)
  const [expandedDim, setExpandedDim] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/stats/tree")
      .then((r) => r.json())
      .then(setTree)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
  }

  if (tree.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">{t("empty")}</div>
  }

  return (
    <div className="space-y-3">
      {tree.map((theme) => (
        <div key={theme.theme_cn} className="rounded-lg border">
          <button
            onClick={() => { setExpandedTheme(expandedTheme === theme.theme_cn ? null : theme.theme_cn); setExpandedModel(null); setExpandedLevel(null); setExpandedDim(null) }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left font-medium hover:bg-muted/50"
          >
            {expandedTheme === theme.theme_cn ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            📂 {theme.theme_cn}
          </button>

          {expandedTheme === theme.theme_cn && (
            <div className="space-y-2 border-t px-4 py-3">
              {theme.ai_models.map((model) => (
                <div key={model.ai_name} className="rounded-lg border bg-card">
                  <button
                    onClick={() => { setExpandedModel(expandedModel === model.ai_name ? null : model.ai_name); setExpandedLevel(null); setExpandedDim(null) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/50"
                  >
                    {expandedModel === model.ai_name ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                    🤖 {model.ai_name}
                  </button>

                  {expandedModel === model.ai_name && (
                    <div className="space-y-2 border-t px-3 py-2">
                      <div className="flex gap-2">
                        {model.levels.map((lvl) => (
                          <button
                            key={lvl.level}
                            onClick={() => {
                              const key = `${model.ai_name}-${lvl.level}`
                              setExpandedLevel(
                                expandedLevel?.model === model.ai_name && expandedLevel?.level === lvl.level
                                  ? null : { model: model.ai_name, level: lvl.level }
                              )
                              setExpandedDim(null)
                            }}
                            className={`flex-1 rounded-lg border p-2 text-center transition-colors hover:shadow-sm ${levelColors[lvl.level] ?? ""} ${
                              expandedLevel?.model === model.ai_name && expandedLevel?.level === lvl.level ? "ring-2 ring-primary" : ""
                            }`}
                          >
                            <div className="text-sm font-bold">{levelLabels[lvl.level]}</div>
                            <div className="text-lg font-bold text-primary">{lvl.overallAvg}</div>
                            <div className="text-xs text-muted-foreground">{t("avgRating", { score: lvl.overallAvg })}</div>
                          </button>
                        ))}
                      </div>

                      {expandedLevel && (
                        <div className="space-y-1 pt-1">
                          {model.levels
                            .filter((l) => l.level === expandedLevel.level)
                            .flatMap((l) => l.dimensions)
                            .map((dim) => (
                              <div key={dim.dimId}>
                                <button
                                  onClick={() => setExpandedDim(expandedDim === dim.dimId ? null : dim.dimId)}
                                  className="flex w-full items-center justify-between rounded px-3 py-2 text-sm hover:bg-muted/50"
                                >
                                  <span>{locale === "en" && dim.title_en ? dim.title_en : dim.title_cn}</span>
                                  <Badge variant="outline">{dim.avgScore}/5</Badge>
                                </button>
                                {expandedDim === dim.dimId && (
                                  <div className="px-3 pb-2">
                                    <StarDistributionChart dimId={dim.dimId} />
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}