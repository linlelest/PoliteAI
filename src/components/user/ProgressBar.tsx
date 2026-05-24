"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export function ProgressBar({
  current,
  total,
}: {
  current: number
  total: number
}) {
  const t = useTranslations("rate")
  const pct = Math.round((current / total) * 100)

  return (
    <div className="sticky top-0 z-10 border-b bg-background px-4 py-3">
      <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t("progress", { current, total })}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-primary to-primary-foreground transition-all duration-300"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}