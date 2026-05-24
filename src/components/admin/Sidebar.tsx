"use client"

import { Link, usePathname } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  BotIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  BarChart3Icon,
  SettingsIcon,
  MessageSquareIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function Sidebar({ username }: { username?: string }) {
  const t = useTranslations("admin")
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const navItems = [
    { href: "/admin/ai", label: t("nav.ai"), icon: BotIcon },
    { href: "/admin/topics", label: t("nav.topics"), icon: FileTextIcon },
    { href: "/admin/dimensions", label: t("nav.dimensions"), icon: LayoutDashboardIcon },
    { href: "/admin/stats", label: t("nav.stats"), icon: BarChart3Icon },
    { href: "/admin/config/rate-limit", label: t("nav.rateLimit"), icon: SettingsIcon },
    { href: "/admin/config/end-prompt", label: t("nav.endPrompt"), icon: MessageSquareIcon },
  ]

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-sidebar-background">
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
          P
        </div>
        <span className="ml-2.5 text-sm font-semibold text-sidebar-foreground">
          PoliteAI
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
          {t("sidebarTitle")}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {username && (
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 flex items-center justify-between px-3 py-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-accent text-[10px] font-medium text-sidebar-accent-foreground">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs text-sidebar-foreground/60">{username}</span>
            </div>
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-6 w-6 items-center justify-center rounded text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground"
              >
                {theme === "dark" ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}