import { NextRequest, NextResponse } from "next/server"
import { getRateLimitConfig, setRateLimitConfig } from "@/lib/redis/rate-limit"
import { verifyAuth } from "@/lib/auth/guard"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const config = await getRateLimitConfig()
  return NextResponse.json(config)
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const maxRounds = Math.max(1, Math.min(100, parseInt(body.maxRounds, 10)))
    const topicsPerRound = Math.max(1, Math.min(100, parseInt(body.topicsPerRound, 10)))
    await setRateLimitConfig(maxRounds, topicsPerRound)
    return NextResponse.json({ maxRounds, topicsPerRound })
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
}