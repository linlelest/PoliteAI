import { cn } from "@/lib/utils"

export function DimensionPreview({ maxScore }: { maxScore?: number }) {
  const stars = maxScore ?? 5

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-colors",
            s <= stars
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {s}
        </div>
      ))}
    </div>
  )
}