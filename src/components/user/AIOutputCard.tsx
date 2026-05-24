"use client"

import { cn } from "@/lib/utils"

export function AIOutputCard({ content }: { content: string }) {
  return (
    <div className="relative rounded-lg border bg-card p-4">
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}