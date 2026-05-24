"use client"

import { useLocale } from "next-intl"
import { cn } from "@/lib/utils"

interface DimData {
  id: string
  title_cn: string
  title_en: string
  desc_cn: string
  desc_en: string
}

const labels = ["极差", "较差", "一般", "良好", "优秀"]

export function RatingGrid({
  dimensions,
  ratings,
  onRate,
}: {
  dimensions: DimData[]
  ratings: Record<string, number>
  onRate: (dimId: string, score: number) => void
}) {
  const locale = useLocale()

  return (
    <div className="space-y-3">
      {dimensions.map((dim) => (
        <div
          key={dim.id}
          className="flex items-center justify-between rounded-lg border bg-card p-3"
        >
          <div className="flex-1">
            <div className="text-sm font-medium">
              {locale === "zh" ? dim.title_cn : dim.title_en || dim.title_cn}
            </div>
            <div className="text-xs text-muted-foreground">
              {locale === "zh" ? dim.desc_cn : dim.desc_en || dim.desc_cn}
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                title={labels[score - 1]}
                onClick={() => onRate(dim.id, score)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors",
                  ratings[dim.id] === score
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}