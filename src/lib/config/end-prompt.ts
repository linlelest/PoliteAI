import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import path from "path"
import { redis } from "@/lib/redis"

const CONFIG_PATH = path.resolve(process.cwd(), "src/data", "config.json")

function ensureConfigDir() {
  const dir = path.dirname(CONFIG_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function readFileConfig(): Record<string, string> {
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

export async function getEndPrompt(): Promise<{ cn: string; en: string }> {
  try {
    const [cn, en] = await Promise.all([
      redis.get<string>("config:end_prompt_cn"),
      redis.get<string>("config:end_prompt_en"),
    ])
    if (cn !== null && cn !== undefined && en !== null && en !== undefined) {
      return { cn, en }
    }
  } catch {}
  const cfg = readFileConfig()
  return { cn: cfg.end_prompt_cn ?? "", en: cfg.end_prompt_en ?? "" }
}

export async function setEndPrompt(cn: string, en: string): Promise<void> {
  try {
    await Promise.all([
      redis.set("config:end_prompt_cn", cn),
      redis.set("config:end_prompt_en", en),
    ])
  } catch {}
  const cfg = readFileConfig()
  cfg.end_prompt_cn = cn
  cfg.end_prompt_en = en
  writeFileConfig(cfg)
}