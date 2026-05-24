"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AIModelItem {
  id: string
  custom_name: string
  is_active: boolean
  created_at: string
}

const CONFIRM_TEXT = "确认"

export function AIDeleteDialog({
  open,
  onOpenChange,
  model,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  model: AIModelItem
  onSuccess: () => void
}) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const confirmed = input === CONFIRM_TEXT

  const handleDelete = async () => {
    if (!confirmed) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      })
      if (res.ok) {
        toast.success("已归档")
        setInput("")
        onSuccess()
      } else {
        toast.error("归档失败")
      }
    } catch {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => { if (!v) setInput(""); onOpenChange(v) }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认归档</AlertDialogTitle>
          <AlertDialogDescription>
            归档后该AI的题目将不会出现在用户评分池中。请输入 <strong>{CONFIRM_TEXT}</strong> 以确认。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label>请输入 &quot;{CONFIRM_TEXT}&quot; 确认</Label>
          <Input value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!confirmed || loading}
          >
            {loading ? "处理中..." : "确认归档"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}