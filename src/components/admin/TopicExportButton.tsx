"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { DownloadIcon } from "lucide-react"
import { toast } from "sonner"

export function TopicExportButton() {
  const t = useTranslations("admin.topics")
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/topics/export")
      if (!res.ok) throw new Error("Export failed")
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const date = new Date().toISOString().slice(0, 10)
      a.download = `topics-export-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t("exportSuccess"))
    } catch {
      toast.error(t("exportFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      <DownloadIcon className="mr-1 h-4 w-4" />
      {loading ? t("exporting") : t("exportJson")}
    </Button>
  )
}