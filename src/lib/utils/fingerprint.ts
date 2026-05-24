"use client"

import { sha256 } from "js-sha256"

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 50
    const ctx = canvas.getContext("2d")
    if (!ctx) return ""
    ctx.textBaseline = "top"
    ctx.font = "14px Arial"
    ctx.fillStyle = "#f60"
    ctx.fillRect(0, 0, 200, 50)
    ctx.fillStyle = "#069"
    ctx.fillText("PoliteAI@" + Date.now(), 10, 10)
    return canvas.toDataURL()
  } catch {
    return ""
  }
}

function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement("canvas")
    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
    if (!gl) return ""
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info") as { UNMASKED_VENDOR_WEBGL: number; UNMASKED_RENDERER_WEBGL: number } | null
    if (!debugInfo) return ""
    return (
      gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + "|" +
      gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    )
  } catch {
    return ""
  }
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return ""
  }
}

function getSalt(): string {
  try {
    let salt = localStorage.getItem("__fp_salt")
    if (!salt) {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      salt = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
      localStorage.setItem("__fp_salt", salt)
    }
    return salt
  } catch {
    return ""
  }
}

export async function generateDeviceFingerprint(): Promise<string> {
  const canvas = getCanvasFingerprint()
  const webgl = getWebGLRenderer()
  const tz = getTimezone()
  const salt = getSalt()
  const raw = [canvas, webgl, tz, salt].join("|||")
  return sha256(raw)
}