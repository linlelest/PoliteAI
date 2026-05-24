import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth/session"

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 })
  response.headers.set("Set-Cookie", clearSessionCookie())
  return response
}