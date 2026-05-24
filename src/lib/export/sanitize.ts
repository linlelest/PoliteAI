import { sha256 } from "js-sha256"

export function sanitizeSessionId(sessionId: string): string {
  const hash = sha256(sessionId)
  return `ANON_${hash.slice(0, 20)}`
}

export function sanitizeExportData(rawData: unknown): unknown {
  if (Array.isArray(rawData)) {
    return rawData.map(sanitizeExportData)
  }

  if (rawData !== null && typeof rawData === "object") {
    const obj = rawData as Record<string, unknown>
    const cleaned: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (key === "session_id") {
        cleaned[key] = sanitizeSessionId(String(value))
      } else if (key === "ip_hash" || key === "device_fingerprint") {
        continue
      } else {
        cleaned[key] = sanitizeExportData(value)
      }
    }

    return cleaned
  }

  return rawData
}