export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="flex border-b bg-muted/30 p-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 flex-1 animate-pulse rounded bg-muted" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex border-b p-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="mr-2 h-3 flex-1 animate-pulse rounded bg-muted/50" />
          ))}
        </div>
      ))}
    </div>
  )
}