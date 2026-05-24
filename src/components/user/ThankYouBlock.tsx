"use client"

import { useTranslations } from "next-intl"
import { CheckCircleIcon } from "lucide-react"

export function ThankYouBlock({ roundNumber }: { roundNumber?: number }) {
  const t = useTranslations("submit")

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CheckCircleIcon className="h-16 w-16 text-green-500" />
      <h2 className="text-2xl font-bold">{t("thankYou")}</h2>
      {roundNumber && (
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
          {t("contributionBadge")} #{roundNumber}
        </span>
      )}
    </div>
  )
}