"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { FileDownIcon, Loader2Icon, LanguagesIcon } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const exports = [
  { labelKey: "exportPdf", url: "/api/export/pdf", ext: "pdf" },
  { labelKey: "exportWeb", url: "/api/export/web", ext: "html" },
  { labelKey: "exportJson", url: "/api/export/json", ext: "json" },
]

export function ExportBar() {
  const t = useTranslations("admin.stats")
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (url: string, ext: string, labelKey: string, lang: string) => {
    const label = t(labelKey)
    setLoading(label + lang)
    try {
      const res = await fetch(`${url}?lang=${lang}`)
      if (!res.ok) throw new Error(await res.text())

      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objUrl
      a.download = `report-${lang}-${new Date().toISOString().slice(0, 10)}.${ext}`
      a.click()
      URL.revokeObjectURL(objUrl)
      toast.success(t("exportSuccess", { label, lang: lang === "zh" ? t("langZh") : t("langEn") }))
    } catch {
      toast.error(t("exportFailed", { label }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      {exports.map((item) => (
        <DropdownMenu key={item.labelKey}>
          <DropdownMenuTrigger
            disabled={loading !== null}
            className={cn(
              "inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg border border-input bg-transparent px-2.5 text-[0.8rem] font-medium whitespace-nowrap text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {loading?.startsWith(t(item.labelKey)) ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <FileDownIcon className="h-4 w-4" />
            )}
            {loading?.startsWith(t(item.labelKey)) ? t("exporting") : t(item.labelKey)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport(item.url, item.ext, item.labelKey, "zh")}>
              <LanguagesIcon className="mr-2 h-3.5 w-3.5" />
              {t("langZh")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(item.url, item.ext, item.labelKey, "en")}>
              <LanguagesIcon className="mr-2 h-3.5 w-3.5" />
              {t("langEn")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  )
}