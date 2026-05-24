"use client"

import { useTranslations } from "next-intl"

export function DraftIndicator({ saving }: { saving: boolean }) {
  const t = useTranslations("rate")

  return (
    <div className="fixed bottom-20 right-4 opacity-50 transition-opacity">
      <span className="text-xs text-muted-foreground">
        {saving ? t("draftSaved") : t("draftSaved")}
      </span>
    </div>
  )
}