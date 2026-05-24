import { Redis } from "@upstash/redis"

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

let warned = false

// ── In-memory Redis fallback for development ──
const mem = new Map<string, { value: any; expiresAt: number }>()
const memSets = new Map<string, Set<string>>()

function memGet(key: string) {
  const entry = mem.get(key)
  if (!entry) return null
  if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
    mem.delete(key)
    return null
  }
  return entry.value
}

function memSet(key: string, value: any, ttlSec?: number) {
  mem.set(key, {
    value,
    expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : 0,
  })
}

function memDel(key: string) {
  mem.delete(key)
}

function memTtl(key: string) {
  const entry = mem.get(key)
  if (!entry) return -2
  if (entry.expiresAt === 0) return -1
  return Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000))
}

function memIncr(key: string) {
  const val = (memGet(key) as number) ?? 0
  memSet(key, val + 1)
  return val + 1
}

function memDecr(key: string) {
  const val = (memGet(key) as number) ?? 0
  memSet(key, Math.max(0, val - 1))
  return Math.max(0, val - 1)
}

function memSadd(key: string, ...members: string[]) {
  if (!memSets.has(key)) memSets.set(key, new Set())
  const set = memSets.get(key)!
  let added = 0
  for (const m of members) { if (!set.has(m)) { set.add(m); added++ } }
  return added
}

function memSmembers(key: string) {
  const set = memSets.get(key)
  return set ? [...set] : []
}

// ── Create Redis-compatible object ──
function createRedis(): Redis {
  if (url && token) {
    return new Redis({ url, token })
  }

  if (!warned) {
    console.warn("[Upstash Redis] Missing URL or token. Using in-memory fallback.")
    warned = true
  }

  return {
    get: (key: string) => Promise.resolve(memGet(key)),
    set: (key: string, value: any, opts?: any) => {
      const ttl = opts?.ex
      memSet(key, value, ttl)
      return Promise.resolve("OK")
    },
    del: (...keys: string[]) => {
      keys.forEach((k) => memDel(k))
      return Promise.resolve(keys.length)
    },
    incr: (key: string) => Promise.resolve(memIncr(key)),
    decr: (key: string) => Promise.resolve(memDecr(key)),
    expire: (key: string, seconds: number) => {
      const val = memGet(key)
      if (val !== null) { memSet(key, val, seconds); return Promise.resolve(1) }
      return Promise.resolve(0)
    },
    ttl: (key: string) => Promise.resolve(memTtl(key)),
    sadd: (key: string, ...members: string[]) => Promise.resolve(memSadd(key, ...members)),
    smembers: (key: string) => Promise.resolve(memSmembers(key)),
  } as unknown as Redis
}

export const redis = createRedis()