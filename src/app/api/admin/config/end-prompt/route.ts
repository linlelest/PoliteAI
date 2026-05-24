import { NextRequest, NextResponse } from "next/server"
import { getEndPrompt, setEndPrompt } from "@/lib/config/end-prompt"
import { verifyAuth } from "@/lib/auth/guard"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prompt = await getEndPrompt()
  return NextResponse.json(prompt)
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const cn = typeof body.cn === "string" ? body.cn : ""
  const en = typeof body.en === "string" ? body.en : ""
  await setEndPrompt(cn, en)
  return NextResponse.json({ cn, en })
}