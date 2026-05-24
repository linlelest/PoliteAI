import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifySessionToken } from "@/lib/auth/session"
import { Sidebar } from "@/components/admin/Sidebar"
import { TopBar } from "@/components/admin/TopBar"
import { Toaster } from "@/components/ui/sonner"

export default async function AdminProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  let username: string | undefined

  if (token) {
    const session = verifySessionToken(token)
    if (session) {
      username = session.username
    }
  }

  if (!username) {
    redirect(`/${locale}/admin/login`)
  }

  return (
    <div className="min-h-screen">
      <Sidebar username={username} />
      <div className="ml-64">
        <TopBar username={username} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}