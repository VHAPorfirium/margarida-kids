import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { hashSenha, criarSessao, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth"
import { rateLimit, getIP } from "@/lib/rate-limit"
import { enviarBoasVindas } from "@/lib/email"

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export async function POST(req: Request) {
  try {
    const ip = getIP(req)
    if (!rateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 1 hora." },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
    }

    const { nome, telefone, email, senha } = body as Record<string, unknown>

    if (typeof nome !== "string" || typeof telefone !== "string" ||
        typeof email !== "string" || typeof senha !== "string") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const nomeTrimmed = nome.trim()
    if (!nomeTrimmed || nomeTrimmed.length < 2 || nomeTrimmed.length > 100) {
      return NextResponse.json({ error: "Nome deve ter entre 2 e 100 caracteres" }, { status: 400 })
    }

    const digits = telefone.replace(/\D/g, "")
    if (digits.length !== 11) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 })
    }

    const emailTrimmed = email.trim().toLowerCase()
    if (!validarEmail(emailTrimmed)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 })
    }

    if (senha.length < 8 || senha.length > 128) {
      return NextResponse.json({ error: "Senha deve ter entre 8 e 128 caracteres" }, { status: 400 })
    }
    if (!/[A-Z]/.test(senha)) {
      return NextResponse.json({ error: "Senha deve ter pelo menos uma letra maiúscula" }, { status: 400 })
    }
    if (!/[0-9]/.test(senha)) {
      return NextResponse.json({ error: "Senha deve ter pelo menos um número" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar telefone duplicado
    const { data: byPhone } = await supabase
      .from("customer_accounts")
      .select("id")
      .eq("telefone", digits)
      .single()
    if (byPhone) {
      return NextResponse.json({ error: "Telefone já cadastrado" }, { status: 409 })
    }

    // Verificar email duplicado
    const { data: byEmail } = await supabase
      .from("customer_accounts")
      .select("id")
      .eq("email", emailTrimmed)
      .single()
    if (byEmail) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 })
    }

    const senha_hash = hashSenha(senha)

    const { error } = await supabase.from("customer_accounts").insert({
      nome: nomeTrimmed,
      telefone: digits,
      email: emailTrimmed,
      senha_hash,
    })

    if (error) throw error

    // Enviar e-mail de boas-vindas (não-bloqueante)
    enviarBoasVindas(nomeTrimmed, emailTrimmed).catch((e) => console.error("welcome email:", e))

    const sessionId = await criarSessao(digits)

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * SESSION_DAYS,
      path: "/",
    })

    return NextResponse.json({ ok: true, nome: nomeTrimmed, telefone: digits })
  } catch (err) {
    console.error("register error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
