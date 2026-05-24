"use client"

import { useTranslations } from "next-intl"
import { SummaryCards } from "@/components/admin/SummaryCards"
import { AccordionTree } from "@/components/admin/AccordionTree"
import { ExportBar } from "@/components/admin/ExportBar"

export default function StatsPage() {
  const t = useTranslations("admin.stats")
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <ExportBar />
      </div>

      <div className="mb-8">
        <SummaryCards />
      </div>

      <AccordionTree />
    </div>
  )
}