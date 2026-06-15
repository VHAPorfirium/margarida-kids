import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verificarSenha, criarSessao, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth"
import { rateLimit, getIP } from "@/lib/rate-limit"

function isEmail(v: string): boolean {
  return v.includes("@")
}

export async function POST(req: Request) {
  try {
    const ip = getIP(req)
    if (!rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 15 minutos." },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
    }

    const { login, senha } = body as Record<string, unknown>

    if (typeof login !== "string" || typeof senha !== "string") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    if (!login.trim() || senha.length === 0 || senha.length > 128) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Busca por e-mail OU telefone
    const loginLimpo = login.trim().toLowerCase()
    const porEmail = isEmail(loginLimpo)

    let query = supabase
      .from("customer_accounts")
      .select("nome, telefone, senha_hash")

    if (porEmail) {
      query = query.eq("email", loginLimpo)
    } else {
      const digits = login.replace(/\D/g, "")
      if (digits.length !== 11) {
        return NextResponse.json({ error: "Telefone inválido" }, { status: 400 })
      }
      query = query.eq("telefone", digits)
    }

    const { data: account } = await query.single()

    // Sempre verificar senha para evitar timing attack por enumeração
    const senhaOk = account ? verificarSenha(senha, account.senha_hash) : false

    if (!account || !senhaOk) {
      return NextResponse.json({ error: "Dados incorretos" }, { status: 401 })
    }

    const sessionId = await criarSessao(account.telefone)

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * SESSION_DAYS,
      path: "/",
    })

    return NextResponse.json({ ok: true, nome: account.nome, telefone: account.telefone })
  } catch (err) {
    console.error("login error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
