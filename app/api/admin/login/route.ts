import { NextResponse } from "next/server"
import { createAdminToken, ADMIN_COOKIE } from "@/lib/admin-session"
import { rateLimit, getIP } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ip = getIP(req)
  if (!rateLimit(`admin-login:${ip}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente em 15 minutos." }, { status: 429 })
  }

  let body: { email?: string; senha?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Requisicao invalida" }, { status: 400 }) }

  const { email, senha } = body
  if (!email || !senha || email !== process.env.ADMIN_EMAIL || senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Email ou senha invalidos" }, { status: 401 })
  }

  const token = await createAdminToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
  return res
}
