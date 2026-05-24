import { NextRequest } from "next/server"
import { verifySessionToken } from "@/lib/auth/session"

export async function verifyAuth(request: NextRequest): Promise<{ authenticated: boolean; username?: string }> {
  const token = request.cookies.get("auth_token")?.value

  if (!token) {
    return { authenticated: false }
  }

  const session = verifySessionToken(token)

  if (!session) {
    return { authenticated: false }
  }

  return { authenticated: true, username: session.username }
}