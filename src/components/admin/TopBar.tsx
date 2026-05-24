"use client"

import { useTranslations } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"

export function TopBar({ username }: { username?: string }) {
  const t = useTranslations("admin")
  const initials = username?.slice(0, 2).toUpperCase() ?? "AD"

  const goToLogin = () => {
    const m = window.location.pathname.match(/^\/(zh|en)\//)
    const lang = m ? m[1] : "zh"
    window.location.href = `/${lang}/admin/login`
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6 ml-64">
      <div className="text-sm text-muted-foreground">{t("title")}</div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-xs text-muted-foreground">
              {username}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" })
                goToLogin()
              }}
            >
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}