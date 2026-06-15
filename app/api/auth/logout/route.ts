import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deletarSessao, SESSION_COOKIE } from "@/lib/auth"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (token) await deletarSessao(token)
    cookieStore.delete(SESSION_COOKIE)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("logout error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
