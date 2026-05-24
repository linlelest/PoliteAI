"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  UndoIcon,
  RedoIcon,
} from "lucide-react"

interface LevelData {
  id?: string
  level: number
  content_md: string
  content_md_en: string
}

interface TopicItem {
  id: string
  ai_model_id: string
  politeness_level: number
  theme_cn?: string
  theme_en?: string
  content_md: string
  content_md_en?: string
  is_active: boolean
}

interface ModelItem {
  id: string
  custom_name: string
}

function ToolBtn({ onClick, active, children }: { onClick: () => void; active: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded p-1 transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
    >
      {children}
    </button>
  )
}

function MiniEditor({
  content,
  onChange,
  minH = "120px",
}: {
  content: string
  onChange: (html: string) => void
  minH?: string
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="rounded border">
      <div className="flex flex-wrap gap-0.5 border-b p-1.5">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <BoldIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <ItalicIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <span className="mx-0.5 w-px bg-border" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <ListIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrderedIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
          <QuoteIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <span className="mx-0.5 w-px bg-border" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} active={false}>
          <UndoIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} active={false}>
          <RedoIcon className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>
      <EditorContent editor={editor} className={`prose prose-sm max-w-none p-3 focus:outline-none`} style={{ minHeight: minH }} />
    </div>
  )
}

export function TopicEditorDialog({
  open,
  onOpenChange,
  topic,
  models,
  prefillTheme,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  topic: TopicItem | null
  models: ModelItem[]
  prefillTheme?: { cn: string; en: string }
  onSuccess: () => void
}) {
  const tr = useTranslations("admin.topics")
  const [themeCn, setThemeCn] = useState("")
  const [themeEn, setThemeEn] = useState("")
  const [aiModelId, setAiModelId] = useState("")
  const [originalCombo, setOriginalCombo] = useState<{ themeCn: string; themeEn: string; aiModelId: string } | null>(null)
  const [levels, setLevels] = useState<LevelData[]>([
    { level: 1, content_md: "", content_md_en: "" },
    { level: 2, content_md: "", content_md_en: "" },
    { level: 3, content_md: "", content_md_en: "" },
  ])
  const [langTab, setLangTab] = useState<"cn" | "en">("cn")
  const [levelTab, setLevelTab] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loadingLevels, setLoadingLevels] = useState(false)
  const isEdit = !!topic

  const updateLevel = useCallback((level: number, field: "content_md" | "content_md_en", value: string) => {
    setLevels((prev) => prev.map((l) => l.level === level ? { ...l, [field]: value } : l))
  }, [])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setLangTab("cn")
      setLevelTab(1)
      if (topic) {
        setThemeCn(topic.theme_cn ?? "")
        setThemeEn(topic.theme_en ?? "")
        setAiModelId(topic.ai_model_id)
        setOriginalCombo({ themeCn: topic.theme_cn ?? "", themeEn: topic.theme_en ?? "", aiModelId: topic.ai_model_id })
      } else {
        setThemeCn(prefillTheme?.cn ?? "")
        setThemeEn(prefillTheme?.en ?? "")
        setAiModelId(models[0]?.id ?? "")
        setOriginalCombo(null)
        setLevels([
          { level: 1, content_md: "", content_md_en: "" },
          { level: 2, content_md: "", content_md_en: "" },
          { level: 3, content_md: "", content_md_en: "" },
        ])
      }
    }
  }, [open, topic, prefillTheme, models])

  // Fetch existing levels when dialog opens — use original combo so changing theme doesn't lose ids
  useEffect(() => {
    if (!open || !originalCombo) return
    const { themeCn: oc, themeEn: oe, aiModelId: oa } = originalCombo
    if (!oa || !oc) return
    const load = async () => {
      setLoadingLevels(true)
      try {
        const res = await fetch(`/api/admin/topics/by-combo?theme_cn=${encodeURIComponent(oc)}&theme_en=${encodeURIComponent(oe)}&ai_model_id=${encodeURIComponent(oa)}`)
        if (res.ok) {
          const existing: { id: string; politeness_level: number; content_md: string; content_md_en: string }[] = await res.json()
          setLevels([1, 2, 3].map((lv) => {
            const found = existing.find((e) => e.politeness_level === lv)
            return {
              id: found?.id,
              level: lv,
              content_md: found?.content_md ?? "",
              content_md_en: found?.content_md_en ?? "",
            }
          }))
        }
      } catch {}
      setLoadingLevels(false)
    }
    load()
  }, [open, originalCombo])

  // Clear content when AI changes
  const handleAiChange = (val: string | null) => {
    if (val) {
      setAiModelId(val)
      if (originalCombo) setOriginalCombo({ ...originalCombo, aiModelId: val })
    }
  }

  const handleSave = async () => {
    if (!aiModelId) { toast.error(tr("selectAiError")); return }
    setSaving(true)
    let success = 0
    let fail = 0

    for (const lv of levels) {
      const contentCn = lv.content_md
      const contentEn = lv.content_md_en
      const hasCn = contentCn && contentCn !== "<p></p>"
      const hasEn = contentEn && contentEn !== "<p></p>"
      if (!hasCn && !hasEn) continue

      try {
        if (lv.id) {
          // Update existing
          const res = await fetch(`/api/admin/topics/${lv.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content_md: contentCn,
              content_md_en: contentEn,
              theme_cn: themeCn,
              theme_en: themeEn,
            }),
          })
          if (res.ok) success++; else fail++
        } else {
          // Create new
          const res = await fetch("/api/admin/topics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ai_model_id: aiModelId,
              politeness_level: lv.level,
              theme_cn: themeCn,
              theme_en: themeEn,
              content_md: contentCn,
              content_md_en: contentEn,
            }),
          })
          if (res.ok) success++; else fail++
        }
      } catch { fail++ }
    }

    setSaving(false)
    if (fail === 0) {
      toast.success(tr("saveSuccess", { count: success }))
      onSuccess()
    } else {
      toast.error(tr("savePartial", { count: fail }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl lg:max-w-5xl">
        <DialogHeader><DialogTitle>{isEdit ? tr("dialogTitleEdit") : tr("dialogTitleNew")}</DialogTitle></DialogHeader>
        <div className="space-y-5">
          {/* Theme + AI row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{tr("themeCn")}</Label>
              <Input value={themeCn} onChange={(e) => setThemeCn(e.target.value)} placeholder={tr("themeCnPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{tr("themeEn")}</Label>
              <Input value={themeEn} onChange={(e) => setThemeEn(e.target.value)} placeholder={tr("themeEnPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{tr("filterAi")}</Label>
              <Select value={aiModelId} onValueChange={handleAiChange}>
                <SelectTrigger><SelectValue>{models.find((m) => m.id === aiModelId)?.custom_name || tr("selectAi")}</SelectValue></SelectTrigger>
                <SelectContent>{models.map((m) => (<SelectItem key={m.id} value={m.id}>{m.custom_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>

          {loadingLevels && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {tr("loading")}
            </div>
          )}

          {!loadingLevels && (
            <div className="space-y-4">
              {/* Language tabs */}
              <div className="flex gap-2">
                <Button type="button" variant={langTab === "cn" ? "default" : "outline"} size="sm" onClick={() => setLangTab("cn")}>{tr("cnContent")}</Button>
                <Button type="button" variant={langTab === "en" ? "default" : "outline"} size="sm" onClick={() => setLangTab("en")}>{tr("enContent")}</Button>
              </div>

              {/* Level tabs */}
              <div className="flex gap-2">
                {[1, 2, 3].map((lv) => {
                  const data = levels.find((l) => l.level === lv)!
                  const hasData = (data.content_md && data.content_md !== "<p></p>") || (data.content_md_en && data.content_md_en !== "<p></p>")
                  return (
                    <Button
                      key={lv}
                      type="button"
                      variant={levelTab === lv ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLevelTab(lv)}
                      className="relative"
                    >
                      L{lv}
                      {hasData && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />}
                    </Button>
                  )
                })}
              </div>

              {/* Single editor */}
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${levelTab === 1 ? "bg-blue-100 text-blue-800" : levelTab === 2 ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"}`}>
                    L{levelTab}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {langTab === "cn" ? tr("cnContent") : tr("enContent")}
                  </span>
                </div>
                {(() => {
                  const data = levels.find((l) => l.level === levelTab)!
                  const html = langTab === "cn" ? data.content_md : data.content_md_en
                  const setHtml = (v: string) => updateLevel(levelTab, langTab === "cn" ? "content_md" : "content_md_en", v)
                  return (
                    <MiniEditor
                      key={`${levelTab}-${langTab}`}
                      content={html}
                      onChange={setHtml}
                    />
                  )
                })()}
              </div>
            </div>
          )}

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? tr("saving") : tr("saveAll")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}