import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const lang = cookieStore.get("lang")?.value || "zh"
  redirect(`/${lang}/admin/ai`)
}