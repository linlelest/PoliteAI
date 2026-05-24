"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">管理后台出错</h1>
      <p className="text-muted-foreground">发生了一个错误。</p>
      <div className="flex gap-3">
        <Button onClick={reset}>重试</Button>
        <Button variant="outline" onClick={() => window.location.href = "/admin"}>
          返回管理首页
        </Button>
      </div>
    </div>
  )
}