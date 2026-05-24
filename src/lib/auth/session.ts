import crypto from "crypto"

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-secret-change-in-production-min-32-chars!!"
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("hex").slice(0, 16)
}

export function createSessionToken(username: string): string {
  const payload = `${username}|${Date.now() + 86400000}`
  const sig = hmac(payload)
  return Buffer.from(`${payload}|${sig}`).toString("base64url")
}

export function verifySessionToken(token: string): { username: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString()
    const parts = decoded.split("|")
    if (parts.length !== 3) return null
    const [username, expiresStr, sig] = parts
    const payload = `${username}|${expiresStr}`
    const expectedSig = hmac(payload)
    if (sig !== expectedSig) return null
    if (Date.now() > Number(expiresStr)) return null
    return { username }
  } catch {
    return null
  }
}

export function setSessionCookie(username: string): string {
  const token = createSessionToken(username)
  return [
    `auth_token=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=86400",
  ].join("; ")
}

export function clearSessionCookie(): string {
  return "auth_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
}