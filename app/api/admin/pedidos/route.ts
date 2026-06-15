import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("criado_em", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("pedidos")
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json()
  const { id, deductStock, restoreStock, items, ...updates } = body
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const supabase = createServiceClient()

  // Deduct stock when confianca order is delivered
  if (deductStock && items?.length) {
    for (const item of items) {
      if (!item.variacao_id) continue
      const { data: v } = await supabase
        .from("variacoes_estoque")
        .select("quantidade_disponivel")
        .eq("id", item.variacao_id)
        .single()
      if (v) {
        await supabase
          .from("variacoes_estoque")
          .update({ quantidade_disponivel: Math.max(0, v.quantidade_disponivel - (item.quantidade ?? item.qty ?? 1)) })
          .eq("id", item.variacao_id)
      }
    }
  }

  // Restore stock when confianca order is returned
  if (restoreStock && items?.length) {
    for (const item of items) {
      if (!item.variacao_id) continue
      const { data: v } = await supabase
        .from("variacoes_estoque")
        .select("quantidade_disponivel")
        .eq("id", item.variacao_id)
        .single()
      if (v) {
        await supabase
          .from("variacoes_estoque")
          .update({ quantidade_disponivel: v.quantidade_disponivel + (item.quantidade ?? 1) })
          .eq("id", item.variacao_id)
      }
    }
  }

  const { data, error } = await supabase
    .from("pedidos")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
