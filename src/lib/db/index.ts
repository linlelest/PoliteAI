import { drizzle } from "drizzle-orm/sql-js"
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js"
import { readFileSync, writeFileSync, existsSync, mkdirSync, openSync, fsyncSync, closeSync } from "fs"
import path from "path"

declare global {
  var __db: ReturnType<typeof drizzle> | undefined
  var __sqlDb: SqlJsDatabase | undefined
}

const DB_DIR = path.resolve(process.cwd(), "src/data")
const DB_PATH = path.join(DB_DIR, "politeai.db")

export async function initDb() {
  if (globalThis.__db) return globalThis.__db

  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }

  const wasmPath = path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm")
  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  })

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    globalThis.__sqlDb = new SQL.Database(buffer)
  } else {
    globalThis.__sqlDb = new SQL.Database()
  }

  globalThis.__sqlDb.run("PRAGMA foreign_keys = ON")
  globalThis.__db = drizzle(globalThis.__sqlDb, { logger: false })

  return globalThis.__db
}

export function saveDb() {
  if (!globalThis.__sqlDb) return
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }
  const data = globalThis.__sqlDb.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
  const fd = openSync(DB_PATH, "r+")
  try {
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
}

export function getDbSync() {
  if (!globalThis.__db) throw new Error("Database not initialized. Call initDb() first.")
  return globalThis.__db
}

export function getSqliteDb() {
  if (!globalThis.__sqlDb) throw new Error("Database not initialized. Call initDb() first.")
  return globalThis.__sqlDb
}