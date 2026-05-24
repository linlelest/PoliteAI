export function displayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  // Handle SQLite literal default
  if (dateStr === "current_timestamp" || dateStr === "CURRENT_TIMESTAMP") {
    return new Date().toLocaleDateString("zh-CN")
  }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("zh-CN")
}