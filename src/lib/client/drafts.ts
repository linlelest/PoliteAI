"use client"

const DB_NAME = "politeai-drafts"
const STORE_NAME = "drafts"
const DB_VERSION = 1

export interface LocalDraftData {
  roundId: string
  currentIndex: number
  ratings: Record<string, Record<string, number>>
  topics?: { id: string; theme_cn: string; theme_en: string; content_md: string; content_md_en: string; ai_model_id: string; politeness_level: number }[]
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "roundId" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveLocalDraft(roundId: string, data: LocalDraftData): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put(data)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  } catch {
    // silently fail
  }
}

export async function getLocalDraft(roundId: string): Promise<LocalDraftData | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const req = tx.objectStore(STORE_NAME).get(roundId)
      req.onsuccess = () => { db.close(); resolve(req.result || null) }
      req.onerror = () => { db.close(); reject(req.error) }
    })
  } catch {
    return null
  }
}

export async function deleteLocalDraft(roundId: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).delete(roundId)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  } catch {
    // silently fail
  }
}

export async function hasLocalDraft(roundId: string): Promise<boolean> {
  const data = await getLocalDraft(roundId)
  return data !== null
}