"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { ImageLightbox } from "@/components/shared/ImageLightbox"
import { ThankYouBlock } from "@/components/user/ThankYouBlock"

export default function SubmitPage() {
  const t = useTranslations("submit")
  const locale = useLocale()
  const router = useRouter()
  const [promptHtml, setPromptHtml] = useState("")
  const [showPrompt, setShowPrompt] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  useEffect(() => {
    localStorage.removeItem("round_id")

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/config/end-prompt")
        if (res.ok) {
          const data = await res.json()
          const html = locale === "zh" ? (data.cn ?? "") : (data.en ?? data.cn ?? "")
          if (html) {
            const processed = html
              .replace(/<a\s/g, '<a target="_blank" rel="noopener noreferrer" ')
            setPromptHtml(processed)
            setShowPrompt(true)
          }
        }
      } catch {}
    }, 500)

    return () => clearTimeout(timer)
  }, [locale])

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === "IMG") {
      e.preventDefault()
      setLightboxSrc((target as HTMLImageElement).src)
    }
  }, [])

  const handleNewRound = () => {
    router.push("/rate")
  }

  const handleExit = () => {
    window.close()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 p-6">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <ThankYouBlock roundNumber={1} />
      <div className="flex gap-4">
        <Button onClick={handleNewRound} size="lg">
          {t("newRound")}
        </Button>
        <Button variant="outline" size="lg" onClick={handleExit}>
          {t("exit")}
        </Button>
      </div>

      <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("promptDialogTitle")}</AlertDialogTitle>
          </AlertDialogHeader>
          <div
            className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:cursor-pointer [&_img]:rounded [&_a]:text-blue-600 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: promptHtml }}
            onClick={handleContentClick}
          />
          <AlertDialogFooter>
            <Button onClick={() => setShowPrompt(false)}>关闭 / Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  )
}
