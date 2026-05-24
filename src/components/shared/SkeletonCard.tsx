export function SkeletonCard({ rows = 1 }: { rows?: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 h-4 w-2/3 animate-pulse rounded bg-muted" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="mb-2 h-3 w-full animate-pulse rounded bg-muted/50" />
      ))}
    </div>
  )
}