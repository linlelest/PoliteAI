"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TopicEditorDialog } from "@/components/admin/TopicEditorDialog"
import { TopicExportButton } from "@/components/admin/TopicExportButton"
import { TopicImportButton } from "@/components/admin/TopicImportButton"
import { PlusIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"

interface TopicItem {
  id: string
  ai_model_id: string
  ai_model_name: string
  politeness_level: number
  theme_cn: string
  theme_en: string
  content_md: string
  content_md_en: string
  is_active: boolean
  created_at: string
}

interface ModelItem {
  id: string
  custom_name: string
}

const levelLabels: Record<number, string> = { 1: "L1", 2: "L2", 3: "L3" }
const levelColors: Record<number, string> = {
  1: "bg-blue-100 text-blue-800",
  2: "bg-amber-100 text-amber-800",
  3: "bg-purple-100 text-purple-800",
}

export function TopicsListClient({
  topics: initial,
  models,
}: {
  topics: TopicItem[]
  models: ModelItem[]
}) {
  const tr = useTranslations("admin.topics")
  const [topics, setTopics] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<TopicItem | null>(null)
  const [filterModel, setFilterModel] = useState("all")
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterActive, setFilterActive] = useState("all")
  const [searchTheme, setSearchTheme] = useState("")
  const [prefillTheme, setPrefillTheme] = useState<{ cn: string; en: string } | null>(null)

  const grouped = useMemo(() => {
    let filtered = topics.filter((t) => {
      if (filterModel !== "all" && t.ai_model_id !== filterModel) return false
      if (filterLevel !== "all" && t.politeness_level !== Number(filterLevel)) return false
      if (filterActive === "active" && !t.is_active) return false
      if (filterActive === "archived" && t.is_active) return false
      if (searchTheme) {
        const q = searchTheme.toLowerCase()
        if (!t.theme_cn.toLowerCase().includes(q) && !t.theme_en.toLowerCase().includes(q)) return false
      }
      return true
    })

    // Group by theme
    const themeGroups = new Map<string, { themeCn: string; themeEn: string; byModel: Map<string, { modelName: string; topics: TopicItem[] }> }>()
    for (const t of filtered) {
      const key = t.theme_cn || t.theme_en || "__untitled__"
      if (!themeGroups.has(key)) themeGroups.set(key, { themeCn: t.theme_cn, themeEn: t.theme_en, byModel: new Map() })
      const group = themeGroups.get(key)!
      if (!group.byModel.has(t.ai_model_id)) group.byModel.set(t.ai_model_id, { modelName: t.ai_model_name, topics: [] })
      group.byModel.get(t.ai_model_id)!.topics.push(t)
    }

    return Array.from(themeGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [topics, filterModel, filterLevel, filterActive, searchTheme])

  const handleToggleActive = async (id: string, current: boolean) => {
    setTopics((prev) => prev.map((t) => t.id === id ? { ...t, is_active: !current } : t))
    try {
      const res = await fetch(`/api/admin/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !current }),
      })
      if (!res.ok) {
        setTopics((prev) => prev.map((t) => t.id === id ? { ...t, is_active: current } : t))
        toast.error(tr("operateFailed"))
      }
    } catch {
      setTopics((prev) => prev.map((t) => t.id === id ? { ...t, is_active: current } : t))
      toast.error(tr("networkError"))
    }
  }

  const handleCreateInTheme = (themeCn: string, themeEn: string) => {
    setPrefillTheme({ cn: themeCn, en: themeEn })
    setShowCreate(true)
  }

  const handleCreateGeneral = () => {
    setPrefillTheme(null)
    setShowCreate(true)
  }

  const handleDeleteTopic = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm(tr("deleteConfirm"))) return
    const rollback = topics
    setTopics((prev) => prev.filter((t) => t.id !== id))
    try {
      const res = await fetch(`/api/admin/topics/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "delete" }),
      })
      if (!res.ok) { setTopics(rollback); toast.error(tr("operateFailed")) }
    } catch { setTopics(rollback); toast.error(tr("networkError")) }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tr("title")}</h1>
        <div className="flex gap-2">
          <TopicExportButton />
          <TopicImportButton onSuccess={() => window.location.reload()} />
          <Button onClick={handleCreateGeneral}>
            <PlusIcon className="mr-1 h-4 w-4" />{tr("new")}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm">{tr("filterAi")}</Label>
          <Select value={filterModel} onValueChange={(v) => v && setFilterModel(v)}>
            <SelectTrigger className="w-40">
              <SelectValue>
                {filterModel === "all" ? tr("filterAll") : models.find((m) => m.id === filterModel)?.custom_name || filterModel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("filterAll")}</SelectItem>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.custom_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">{tr("filterLevel")}</Label>
          <Select value={filterLevel} onValueChange={(v) => v && setFilterLevel(v)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("filterAll")}</SelectItem>
              <SelectItem value="1">L1</SelectItem>
              <SelectItem value="2">L2</SelectItem>
              <SelectItem value="3">L3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">{tr("filterStatus")}</Label>
          <Select value={filterActive} onValueChange={(v) => v && setFilterActive(v)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("filterAll")}</SelectItem>
              <SelectItem value="active">{tr("statusActive")}</SelectItem>
              <SelectItem value="archived">{tr("statusArchived")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">{tr("searchTheme")}</Label>
          <Input
            placeholder={tr("searchPlaceholder")}
            value={searchTheme}
            onChange={(e) => setSearchTheme(e.target.value)}
            className="w-48 h-9"
          />
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">{tr("empty")}</div>
      )}

      <div className="space-y-6">
        {grouped.map(([key, group]) => (
          <div key={key} className="rounded-lg border">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{group.themeCn || tr("noTheme")}</span>
                  {group.themeEn && (
                    <span className="text-xs text-muted-foreground">/ {group.themeEn}</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleCreateInTheme(group.themeCn, group.themeEn)}>
                  <PlusIcon className="mr-1 h-3 w-3" />{tr("addAi")}
                </Button>
              </div>

            <div className="divide-y p-4">
              {Array.from(group.byModel.entries()).map(([modelId, modelGroup]) => {
                const sorted = [...modelGroup.topics].sort((a, b) => a.politeness_level - b.politeness_level)
                return (
                  <div key={modelId} className="group cursor-pointer py-3 first:pt-0 last:pb-0" onClick={() => {
                    const first = sorted[0]
                    setEditing({ ...first, theme_cn: group.themeCn, theme_en: group.themeEn })
                  }}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">{modelGroup.modelName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{tr("items", { count: sorted.length })}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {sorted.map((t) => (
                        <div key={t.id} className="flex items-center gap-3 rounded-md bg-muted/20 px-3 py-2 text-xs">
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${levelColors[t.politeness_level]}`}>
                            {levelLabels[t.politeness_level]}
                          </span>
                          <span className="flex-1 truncate text-muted-foreground">
                            {tr("cnLabel")} {t.content_md.replace(/<[^>]*>/g, "").slice(0, 60)}
                          </span>
                          <span className="hidden flex-1 truncate text-muted-foreground sm:block">
                            {tr("enLabel")} {t.content_md_en.replace(/<[^>]*>/g, "").slice(0, 60) || tr("emptyEn")}
                          </span>
                          <Switch
                            checked={t.is_active}
                            onCheckedChange={(v) => { v !== undefined && handleToggleActive(t.id, t.is_active) }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => handleDeleteTopic(e, t.id)}
                            className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {group.byModel.size === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  {tr("noModel")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TopicEditorDialog
        open={showCreate || !!editing}
        onOpenChange={(v) => { if (!v) { setShowCreate(false); setEditing(null); setPrefillTheme(null) } }}
        topic={editing}
        models={models}
        prefillTheme={prefillTheme || undefined}
        onSuccess={async () => {
          setShowCreate(false); setEditing(null); setPrefillTheme(null)
          try { const r = await fetch("/api/admin/topics"); if (r.ok) setTopics(await r.json()) } catch {}
        }}
      />
    </div>
  )
}