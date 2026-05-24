"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguagesIcon } from "lucide-react"

export default function RootPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const lang = sessionStorage.getItem("lang_chosen")
    if (lang) {
      router.replace(`/${lang}`)
    } else {
      setReady(true)
    }
  }, [router])

  const chooseLang = (locale: string) => {
    sessionStorage.setItem("lang_chosen", locale)
    router.replace(`/${locale}`)
  }

  if (!ready) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 backdrop-blur-sm">
          <LanguagesIcon className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">选择语言 / Choose Language</h1>
          <p className="mt-2 text-sm text-muted-foreground">请选择您的语言 / Please select your language</p>
        </div>
        <div className="flex gap-4">
          <Button size="lg" className="min-w-[140px] rounded-full px-8 py-6 text-base shadow-lg" onClick={() => chooseLang("zh")}>
            🇨🇳 中文
          </Button>
          <Button size="lg" className="min-w-[140px] rounded-full px-8 py-6 text-base shadow-lg" onClick={() => chooseLang("en")}>
            🇺🇸 English
          </Button>
        </div>
      </div>
    </div>
  )
}