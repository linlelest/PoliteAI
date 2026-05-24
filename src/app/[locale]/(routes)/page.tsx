"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { GeometricBackground } from "@/components/shared/GeometricBackground"
import { LogInIcon } from "lucide-react"

export default function WelcomePage() {
  const t = useTranslations("home")
  const rt = useTranslations("rules")
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)

  const handleStart = () => {
    setPrivacyOpen(true)
  }

  const handlePrivacyConfirm = () => {
    if (!privacyChecked) return
    setPrivacyOpen(false)
    setLoading(true)
    router.push("/rate")
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <GeometricBackground />
      <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => router.push("/admin/login")}>
            <LogInIcon className="mr-1 h-3 w-3" />{t("adminEntry")}
          </Button>
        </div>
        <LanguageSwitcher />
      </div>
      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 backdrop-blur-sm">
          <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        <p className="max-w-sm text-sm text-muted-foreground/60">{t("privacy")}</p>
        <Button size="lg" className="mt-2 rounded-full px-10 py-6 text-base shadow-lg transition-all hover:translate-y-[-2px] hover:shadow-xl" onClick={handleStart} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t("startButton")}
            </span>
          ) : t("startButton")}
        </Button>
      </div>

      <AlertDialog open={privacyOpen} onOpenChange={(v) => { if (!v) { setPrivacyOpen(false); setPrivacyChecked(false) } }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{rt("privacyTitle")}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground px-1">
            {rt("privacyBody")}
          </div>
          <div className="flex items-center gap-2 px-1">
            <Checkbox id="privacy-check" checked={privacyChecked} onCheckedChange={(c) => setPrivacyChecked(c === true)} />
            <Label htmlFor="privacy-check" className="cursor-pointer text-sm">{rt("privacyAcknowledge")}</Label>
          </div>
          <AlertDialogFooter>
            <Button onClick={handlePrivacyConfirm} disabled={!privacyChecked}>{rt("privacyConfirmBtn")}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}