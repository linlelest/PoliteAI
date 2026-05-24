"use client"

import { useEffect, useState } from "react"
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

export default function AdminRegisterPage() {
  const t = useTranslations("admin.register")
  const adminT = useTranslations("admin")
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const registerSchema = z.object({
    username: z.string().min(3, t("usernameMinLength")),
    password: z.string().min(8, t("passwordMinLength")),
    confirmPassword: z.string().min(1),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("passwordMismatch"),
    path: ["confirmPassword"],
  })

  type RegisterForm = z.infer<typeof registerSchema>

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  useEffect(() => {
    fetch("/api/auth/check-init")
      .then((r) => r.json())
      .then((data) => {
        if (data.initialized) {
          router.replace(`/${getLang()}/admin/login`)
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [router])

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username, password: data.password }),
      })

      if (res.ok) {
        toast.success(t("success"))
        router.push(`/${getLang()}/admin/ai`)
      } else {
        const err = await res.json()
        toast.error(err.error || t("failed"))
      }
    } catch {
      toast.error(t("networkError"))
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} disabled={loading} />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("submitting") : t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}