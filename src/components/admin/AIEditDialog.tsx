"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  custom_name: z.string().min(1, "名称不能为空").max(50, "名称最长50个字符"),
})

interface AIModelItem {
  id: string
  custom_name: string
  is_active: boolean
  created_at: string
}

export function AIEditDialog({
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
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { custom_name: model.custom_name },
  })

  const onSubmit = async (data: { custom_name: string }) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success("更新成功")
        onSuccess()
      } else {
        const err = await res.json()
        toast.error(err.error || "更新失败")
      }
    } catch {
      toast.error("网络错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑AI</DialogTitle>
          <DialogDescription>修改AI模型名称</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">名称</Label>
            <Input id="edit-name" {...register("custom_name")} disabled={loading} />
            {errors.custom_name && (
              <p className="text-sm text-destructive">{errors.custom_name.message as string}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "更新中..." : "保存"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}