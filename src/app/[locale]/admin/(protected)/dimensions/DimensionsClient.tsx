"use client"

import { useState, useCallback, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DimensionPreview } from "@/components/admin/DimensionPreview"
import { GripVerticalIcon, PlusIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"

interface DimensionItem {
  id: string
  title_cn: string
  title_en: string
  desc_cn: string
  desc_en: string
  max_score: number
  sort_order: number
  is_active: boolean
  created_at: string
}

const emptyDim = {
  title_cn: "", title_en: "", desc_cn: "", desc_en: "",
  max_score: 5, is_active: true,
}

export function DimensionsClient({ dimensions: initial }: { dimensions: DimensionItem[] }) {
  const t = useTranslations("admin.dimensions")
  const [items, setItems] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const updateItem = useCallback((id: string, field: string, value: unknown) => {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }, [])

  const saveItem = useCallback(async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/dimensions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || t("saveFailed"))
      }
    } catch {
      toast.error(t("networkError"))
    }
  }, [])

  const handleAdd = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/dimensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emptyDim),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.dimension) {
          setItems((prev) => [...prev, data.dimension])
        } else {
          window.location.reload()
        }
      } else {
        const err = await res.json()
        toast.error(err.error || t("saveFailed"))
      }
    } catch {
      toast.error(t("networkError"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (items.length <= 1) {
      toast.error(t("minOne"))
      return
    }
    const prev = items
    setItems((prev) => prev.filter((d) => d.id !== id))
    try {
      const res = await fetch(`/api/admin/dimensions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      })
      if (!res.ok) {
        setItems(prev)
        toast.error(t("deleteFailed"))
      }
    } catch {
      setItems(prev)
      toast.error(t("networkError"))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((d) => d.id === active.id)
    const newIndex = items.findIndex((d) => d.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...items]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    setItems(reordered)

    const updates = reordered.map((d, i) => ({ id: d.id, sort_order: i }))
    try {
      const res = await fetch("/api/admin/dimensions/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        window.location.reload()
      }
    } catch {
      window.location.reload()
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button
          onClick={handleAdd}
          disabled={items.length >= 10 || saving}
          title={items.length >= 10 ? t("maxReached") : t("add")}
        >
          <PlusIcon className="mr-1 h-4 w-4" />{t("add")}
          {items.length >= 10 && <span className="ml-1 text-xs opacity-70">{t("atLimit")}</span>}
        </Button>
      </div>

      {mounted ? (
        <DndContext id="dimensions-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((dim) => (
                <SortableRow
                  key={dim.id}
                  dim={dim}
                  onUpdate={(f, v) => updateItem(dim.id, f, v)}
                  onSave={(data) => saveItem(dim.id, data)}
                  onDelete={() => handleDelete(dim.id)}
                  canDelete={items.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {items.map((dim) => (
            <div key={dim.id} className="flex items-start gap-3 rounded-lg border bg-background p-4">
              <div className="flex flex-1 flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm font-medium">{dim.title_cn}</div>
                  <div className="text-sm font-medium">{dim.title_en}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">{t("empty")}</div>
      )}
    </div>
  )
}

function SortableRow({
  dim,
  onUpdate,
  onSave,
  onDelete,
  canDelete,
}: {
  dim: DimensionItem
  onUpdate: (field: string, value: unknown) => void
  onSave: (data: Record<string, unknown>) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const t = useTranslations("admin.dimensions")
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dim.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-lg border bg-background p-4"
    >
      <button
        className="mt-1 cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="h-5 w-5" />
      </button>

      <div className="flex flex-1 flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t("titleCn")}</Label>
            <Input
              value={dim.title_cn}
              onChange={(e) => onUpdate("title_cn", e.target.value)}
              onBlur={() => onSave({ title_cn: dim.title_cn })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("titleEn")}</Label>
            <Input
              value={dim.title_en}
              onChange={(e) => onUpdate("title_en", e.target.value)}
              onBlur={() => onSave({ title_en: dim.title_en })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t("descCn")}</Label>
            <Textarea
              value={dim.desc_cn}
              onChange={(e) => onUpdate("desc_cn", e.target.value)}
              onBlur={() => onSave({ desc_cn: dim.desc_cn })}
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("descEn")}</Label>
            <Textarea
              value={dim.desc_en}
              onChange={(e) => onUpdate("desc_en", e.target.value)}
              onBlur={() => onSave({ desc_en: dim.desc_en })}
              rows={2}
            />
          </div>
        </div>

        <DimensionPreview maxScore={dim.max_score} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={dim.is_active}
              onCheckedChange={(v) => {
                onUpdate("is_active", v)
                onSave({ is_active: v })
              }}
            />
            <span className="text-xs text-muted-foreground">
              {dim.is_active ? t("active") : t("inactive")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={!canDelete}
            title={t("delete")}
          >
            <TrashIcon className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  )
}