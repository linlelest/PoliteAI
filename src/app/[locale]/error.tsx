"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function UserErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("User error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">出错了</h1>
      <p className="text-muted-foreground">发生了一个错误，请重试。</p>
      <Button onClick={reset}>重试</Button>
    </div>
  )
}