"use client"

import { useEffect, useState } from "react"

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)

    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)

    window.addEventListener("offline", goOffline)
    window.addEventListener("online", goOnline)
    return () => {
      window.removeEventListener("offline", goOffline)
      window.removeEventListener("online", goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed left-0 right-0 top-0 z-50 bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-white">
      当前离线，恢复连接后将自动同步
    </div>
  )
}