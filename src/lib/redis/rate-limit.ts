import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import path from "path"
import { redis } from "@/lib/redis"

const DEFAULT_MAX_ROUNDS = 5
const DEFAULT_TOPICS_PER_ROUND = 5
const CONFIG_PATH = path.resolve(process.cwd(), "src/data", "config.json")

function ensureConfigDir() {
  const dir = path.dirname(CONFIG_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function readFileConfig(): Record<string, unknown> {
  try {
    ensureConfigDir()
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"))
    }
  } catch {}
  return {}
}

function writeFileConfig(data: Record<string, unknown>) {
  ensureConfigDir()
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), "utf-8")
}

async function getRedisOrFile<T>(key: string, fileKey: string, fallback: T): Promise<T> {
  try {
    const val = await redis.get<T>(key)
    if (val !== null && val !== undefined) return val
  } catch {}
  const cfg = readFileConfig()
  return (cfg[fileKey] as T) ?? fallback
}

export async function getRateLimitConfig(): Promise<{ maxRounds: number; topicsPerRound: number }> {
  const [maxRounds, topicsPerRound] = await Promise.all([
    getRedisOrFile<number>("config:rate_limit_max", "rate_limit_max", DEFAULT_MAX_ROUNDS),
    getRedisOrFile<number>("config:topics_per_round", "topics_per_round", DEFAULT_TOPICS_PER_ROUND),
  ])
  return { maxRounds, topicsPerRound }
}

export async function setRateLimitConfig(maxRounds: number, topicsPerRound: number): Promise<void> {
  const cfg = readFileConfig()
  cfg.rate_limit_max = maxRounds
  cfg.topics_per_round = topicsPerRound
  writeFileConfig(cfg)
  try {
    await Promise.all([
      redis.set("config:rate_limit_max", maxRounds),
      redis.set("config:topics_per_round", topicsPerRound),
    ])
  } catch {}
}

function getDateKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function getEndOfDayTTL(): number {
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return Math.floor((endOfDay.getTime() - now.getTime()) / 1000)
}

export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean
  remaining: number
  maxRounds: number
  resetAtMs: number
}> {
  const { maxRounds } = await getRateLimitConfig()
  const key = `rate:${ip}:${getDateKey()}`

  const count = await redis.incr(key)
  if (count === 1) {
    const ttl = getEndOfDayTTL()
    await redis.expire(key, ttl)
  }

  const ttl = await redis.ttl(key)
  const resetAtMs = Date.now() + ttl * 1000

  return {
    allowed: count <= maxRounds,
    remaining: Math.max(0, maxRounds - count),
    maxRounds,
    resetAtMs,
  }
}

export async function decrementRateLimit(ip: string): Promise<void> {
  const key = `rate:${ip}:${getDateKey()}`
  const count = await redis.get<number>(key)
  if (count && count > 0) {
    await redis.decr(key)
  }
}