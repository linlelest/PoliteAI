import type { Metadata } from "next"
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "PoliteAI",
  description: "AI Politeness Evaluation Experiment",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}