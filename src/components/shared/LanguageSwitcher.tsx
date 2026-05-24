"use client"

export function LanguageSwitcher() {
  const go = (locale: string) => {
    try { sessionStorage.setItem("lang_chosen", locale) } catch {}
    document.cookie = `lang=${locale};path=/;max-age=86400`
    const p = window.location.pathname
    const stripped = p.replace(/^\/(zh|en)(\/|$)/, "/")
    const target = stripped === "/" ? `/${locale}` : `/${locale}${stripped}`
    window.location.assign(target + "?_r=" + Math.random().toString(36).slice(2, 6))
  }

  return (
    <div className="flex items-center gap-0.5 rounded-md border p-0.5">
      <button onClick={() => go("zh")} className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        中文
      </button>
      <span className="text-xs text-muted-foreground/30">|</span>
      <button onClick={() => go("en")} className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        EN
      </button>
    </div>
  )
}