import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { hashSenha } from "@/lib/auth"
import { validarResetToken, consumirResetToken } from "@/lib/reset-token"
import { rateLimit, getIP } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const ip = getIP(req)
    if (!rateLimit(`reset:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body.token !== "string" || typeof body.senha !== "string") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const { token, senha } = body as { token: string; senha: string }

    if (senha.length < 8 || senha.length > 128) {
      return NextResponse.json({ error: "Senha deve ter entre 8 e 128 caracteres" }, { status: 400 })
    }
    if (!/[A-Z]/.test(senha)) {
      return NextResponse.json({ error: "Senha deve ter pelo menos uma letra maiúscula" }, { status: 400 })
    }
    if (!/[0-9]/.test(senha)) {
      return NextResponse.json({ error: "Senha deve ter pelo menos um número" }, { status: 400 })
    }

    const email = await validarResetToken(token)
    if (!email) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Solicite um novo." },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from("customer_accounts")
      .update({ senha_hash: hashSenha(senha) })
      .eq("email", email)

    if (error) throw error

    // Invalida o token após uso
    await consumirResetToken(token)

    // Invalida todas as sessões ativas do usuário
    await supabase
      .from("customer_sessions")
      .update({ expires_at: new Date().toISOString() })
      .eq("telefone", (await supabase
        .from("customer_accounts")
        .select("telefone")
        .eq("email", email)
        .single()
      ).data?.telefone ?? "")

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("reset-password error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
