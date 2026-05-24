import { NextResponse } from "next/server"
import { getEndPrompt } from "@/lib/config/end-prompt"

export async function GET() {
  const prompt = await getEndPrompt()
  return NextResponse.json(prompt)
}