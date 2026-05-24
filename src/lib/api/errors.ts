import { NextResponse } from "next/server"

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.status }
    )
  }

  const msg = error instanceof Error ? error.message : "Unknown error"

  if (msg.includes("drizzle") || msg.includes("SQLITE")) {
    return NextResponse.json({ error: "database_error", message: "Database error" }, { status: 500 })
  }

  if (msg.includes("Redis") || msg.includes("redis") || msg.includes("connect")) {
    return NextResponse.json({ error: "service_unavailable", message: "Service unavailable" }, { status: 503 })
  }

  if (msg.includes("validation") || msg.includes("zod")) {
    return NextResponse.json({ error: "validation_error", message: "Validation error" }, { status: 400 })
  }

  if (msg.includes("auth") || msg.includes("unauthorized") || msg.includes("Unauthorized")) {
    return NextResponse.json({ error: "unauthorized", message: "Unauthorized" }, { status: 401 })
  }

  console.error("Unhandled API error:", error)
  return NextResponse.json({ error: "internal_error", message: "Internal server error" }, { status: 500 })
}