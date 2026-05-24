"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PencilIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"
import { displayDate } from "@/lib/utils/date"

interface AIModelItem {
  id: string
  custom_name: string
  is_active: boolean
  created_at: string
}

export function AIListClient({ models: initial }: { models: AIModelItem[] }) {
  const t = useTranslations("admin.ai")
  const adminT = useTranslations("admin")
  const [items, setItems] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<AIModelItem | null>(null)
  const [deleting, setDeleting] = useState<AIModelItem | null>(null)

  const handleCreate = async (name: string) => {
    const res = await fetch("/api/admin/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_name: name }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || t("createFailed"))
    }
    if (!data.model) {
      throw new Error(t("createFailed"))
    }
    setItems((prev) => [...prev, data.model])
  }

  const handleEdit = async (id: string, name: string) => {
    const res = await fetch(`/api/admin/ai/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_name: name }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || t("updateFailed"))
    }
    setItems((prev) => prev.map((m) => m.id === id ? { ...m, custom_name: name } : m))
  }

  const handleDelete = async (id: string) => {
    const rollback = items
    setItems((cur) => cur.filter((m) => m.id !== id))
    try {
      const res = await fetch(`/api/admin/ai/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: t("deleteFailed") }))
        setItems(rollback)
        toast.error(err.error || t("deleteFailed"))
      }
    } catch {
      setItems(rollback)
      toast.error(t("networkError"))
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    setItems((prev) => prev.map((m) => m.id === id ? { ...m, is_active: !current } : m))
    const res = await fetch(`/api/admin/ai/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    })
    if (!res.ok) {
      setItems((prev) => prev.map((m) => m.id === id ? { ...m, is_active: current } : m))
      toast.error(t("deleteFailed"))
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => setShowCreate(true)}>{t("new")}</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("createdAt")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((model) => (
            <TableRow key={model.id}>
              <TableCell className="font-medium">{model.custom_name}</TableCell>
              <TableCell className="text-muted-foreground">{displayDate(model.created_at)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={model.is_active}
                    onCheckedChange={() => handleToggleActive(model.id, model.is_active)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {model.is_active ? t("active") : t("archived")}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(model)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(model)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">{t("empty")}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {showCreate && (
        <InlineDialog
          title={t("new")}
          initialValue=""
          onSave={async (v) => { await handleCreate(v); setShowCreate(false) }}
          onCancel={() => setShowCreate(false)}
          saveLabel={t("save")}
          savingLabel={t("saving")}
          cancelLabel={t("cancel")}
        />
      )}
      {editing && (
        <InlineDialog
          title={t("edit")}
          initialValue={editing.custom_name}
          onSave={async (v) => { await handleEdit(editing.id, v); setEditing(null) }}
          onCancel={() => setEditing(null)}
          saveLabel={t("save")}
          savingLabel={t("saving")}
          cancelLabel={t("cancel")}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={t("delete")}
          message={t("deleteConfirm")}
          confirmText={t("deleteConfirmText")}
          onConfirm={async () => { await handleDelete(deleting.id); setDeleting(null) }}
          onCancel={() => setDeleting(null)}
          processingLabel={t("processing")}
          cancelLabel={t("cancel")}
        />
      )}
    </div>
  )
}

function InlineDialog({ title, initialValue, onSave, onCancel, saveLabel, savingLabel, cancelLabel }: {
  title: string; initialValue: string; onSave: (v: string) => Promise<void>; onCancel: () => void
  saveLabel: string; savingLabel: string; cancelLabel: string
}) {
  const [value, setValue] = useState(initialValue)
  const [busy, setBusy] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <input
          className="mb-4 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button size="sm" disabled={!value || busy} onClick={async () => { setBusy(true); try { await onSave(value) } catch (e: any) { toast.error(e.message) } finally { setBusy(false) } }}>
            {busy ? savingLabel : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ title, message, confirmText, onConfirm, onCancel, processingLabel, cancelLabel }: {
  title: string; message: string; confirmText: string; onConfirm: () => Promise<void>; onCancel: () => void
  processingLabel: string; cancelLabel: string
}) {
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        <input
          className="mb-4 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
          placeholder={`${confirmText}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button size="sm" disabled={input !== confirmText || busy} onClick={async () => { setBusy(true); try { await onConfirm() } catch (e: any) { toast.error(e.message || "操作失败") } finally { setBusy(false) } }}>
            {busy ? processingLabel : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}