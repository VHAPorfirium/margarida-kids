import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { lerSessao } from "@/lib/auth"

export async function GET() {
  try {
    const telefone = await lerSessao()
    if (!telefone) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from("pedidos")
      .select("id, items, total, status, tipo, criado_em")
      .eq("cliente_telefone", telefone)
      .order("criado_em", { ascending: false })

    if (error) throw error

    return NextResponse.json({ pedidos: data ?? [] })
  } catch (err) {
    console.error("meus-pedidos error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
