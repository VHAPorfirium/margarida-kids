import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Requer autenticação de admin
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params

  // Validar UUID
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
  }

  const { items, total } = body as { items: unknown; total: unknown }

  if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
    return NextResponse.json({ error: "Items inválidos" }, { status: 400 })
  }

  // Recalcular total server-side
  const normalizedItems = items.map((it) => {
    const item = it as Record<string, unknown>
    return {
      nome: String(item.nome ?? "").trim().slice(0, 200),
      tamanho: String(item.tamanho ?? "").trim().slice(0, 20),
      quantidade: Math.max(1, Math.min(50, Number(item.quantidade ?? item.qty ?? 1))),
      preco: parseFloat(Math.max(0, Math.min(99999, Number(item.preco ?? 0))).toFixed(2)),
      ...(item.foto ? { foto: String(item.foto).slice(0, 500) } : {}),
    }
  })

  const totalCalculado = parseFloat(
    normalizedItems.reduce((sum, it) => sum + it.preco * it.quantidade, 0).toFixed(2)
  )

  // Aceitar total manual do admin (pode ter descontos), mas com limite razoável
  const totalFinal = (typeof total === "number" && total >= 0 && total <= 999999)
    ? parseFloat(total.toFixed(2))
    : totalCalculado

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from("pedidos")
    .update({ items: normalizedItems, total: totalFinal })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
  return NextResponse.json(data)
}
