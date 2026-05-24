import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { routing } from "@/i18n/routing"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { GeometricBackground } from "@/components/shared/GeometricBackground"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: {
    template: "%s | PoliteAI",
    default: "PoliteAI - AI礼貌性评估实验",
  },
  description: "参与AI礼貌性评估实验，帮助AI变得更礼貌",
  openGraph: {
    title: "PoliteAI - AI礼貌性评估实验",
    description: "参与AI礼貌性评估实验，帮助AI变得更礼貌",
    type: "website",
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const validLocales = routing.locales as readonly string[]
  if (!validLocales.includes(locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TooltipProvider>
        <GeometricBackground />
        {children}
        <Toaster position="bottom-right" duration={3000} />
      </TooltipProvider>
    </NextIntlClientProvider>
  )
}