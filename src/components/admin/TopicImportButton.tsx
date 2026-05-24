"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { UploadIcon } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

export function TopicImportButton({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("admin.topics")
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleClick = () => inputRef.current?.click()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      toast.error(t("importSelectFile"))
      return
    }

    setLoading(true)
    setProgress(50)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const topics = data.topics ?? data
      if (!Array.isArray(topics)) {
        toast.error(t("importInvalidFormat"))
        setLoading(false)
        setProgress(0)
        return
      }

      const res = await fetch("/api/admin/topics/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topics),
      })

      const result = await res.json()
      setProgress(100)

      if (res.ok) {
        toast.success(t("importSuccess", { count: result.created }))
        if (result.failed > 0) {
          toast.warning(t("importPartial", { count: result.failed }))
        }
        onSuccess()
      } else {
        if (result.errors) {
          toast.error(t("importErrors", { count: result.errors.length }))
          console.error("Import errors:", result.errors)
        } else {
          toast.error(result.error || t("importFailed"))
        }
      }
    } catch {
      toast.error(t("importParseError"))
    } finally {
      setLoading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFile}
      />
      <Button variant="outline" onClick={handleClick} disabled={loading}>
        <UploadIcon className="mr-1 h-4 w-4" />
        {loading ? t("importing") : t("importJson")}
      </Button>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Progress value={progress} className="w-64" />
        </div>
      )}
    </>
  )
}