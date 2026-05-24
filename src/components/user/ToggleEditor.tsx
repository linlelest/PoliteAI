"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ToggleEditor({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations("submit")
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch id="toggle-editor" checked={show} onCheckedChange={setShow} />
        <Label htmlFor="toggle-editor" className="cursor-pointer text-sm">
          {t("editToggle")}
        </Label>
      </div>
      {show && <div className="animate-in fade-in slide-in-from-top-2 duration-300">{children}</div>}
    </div>
  )
}