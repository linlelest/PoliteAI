"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function getLang(): string {
  if (typeof window === "undefined") return "zh"
  const m = window.location.pathname.match(/^\/(zh|en)\//)
  return m ? m[1] : "zh"
}

export default function AdminLoginPage() {
  const t = useTranslations("admin.login")
  const adminT = useTranslations("admin")
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [retryAfter, setRetryAfter] = useState(0)
  const [checkingInit, setCheckingInit] = useState(true)

  const loginSchema = z.object({
    username: z.string().min(1, t("usernameRequired")),
    password: z.string().min(1, t("passwordRequired")),
  })

  type LoginForm = z.infer<typeof loginSchema>

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    fetch("/api/auth/check-init")
      .then((r) => r.json())
      .then((data) => {
        if (!data.initialized) {
          router.replace(`/${getLang()}/admin/register`)
        } else {
          setCheckingInit(false)
        }
      })
      .catch(() => router.replace(`/${getLang()}/admin/register`))
  }, [router])

  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [retryAfter])

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        router.push(`/${getLang()}/admin/ai`)
      } else if (res.status === 429) {
        const err = await res.json()
        setRetryAfter(err.retryAfter ?? 60)
        toast.error(t("tooManyAttempts"))
      } else if (res.status === 401) {
        toast.error(t("wrongCredentials"))
      } else {
        toast.error(t("failed"))
      }
    } catch {
      toast.error(t("networkError"))
    } finally {
      setLoading(false)
    }
  }

  if (checkingInit) {
    return <div className="flex min-h-screen items-center justify-center">{adminT("loading")}</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("username")}</Label>
              <Input id="username" {...register("username")} disabled={loading} />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" {...register("password")} disabled={loading} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || retryAfter > 0}>
              {retryAfter > 0 ? t("retryAfter", { s: retryAfter }) : loading ? t("loggingIn") : t("login")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}