import { InboxIcon } from "lucide-react"

export function EmptyState({
  message,
  icon,
}: {
  message: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      {icon ?? <InboxIcon className="h-12 w-12 text-muted-foreground" />}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}