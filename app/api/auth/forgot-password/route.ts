import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { rateLimit, getIP } from "@/lib/rate-limit"
import { gerarResetToken } from "@/lib/reset-token"
import { enviarResetSenha } from "@/lib/email"

export async function POST(req: Request) {
  try {
    // Rate limit: 3 tentativas por IP a cada 15 min
    const ip = getIP(req)
    if (!rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde 15 minutos." },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body.email !== "string") {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 })
    }

    const email = body.email.trim().toLowerCase()
    if (!email.includes("@") || email.length > 254) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: account } = await supabase
      .from("customer_accounts")
      .select("nome, email")
      .eq("email", email)
      .single()

    // Resposta sempre igual para não revelar se e-mail existe
    if (!account) {
      return NextResponse.json({ ok: true })
    }

    const token = await gerarResetToken(email)
    await enviarResetSenha(account.nome, email, token)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("forgot-password error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
