import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const disponivelOnly = searchParams.get("disponivel") === "1"

  const supabase = createServiceClient()
  let query = supabase
    .from("produtos")
    .select("*,variacoes_estoque(*)")
    .order("criado_em", { ascending: false })

  if (disponivelOnly) query = query.eq("status", "disponivel")

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id, ...updates } = await req.json()
  const supabase = createServiceClient()
  const { error } = await supabase.from("produtos").update(updates).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { variacoes, ...produto } = await req.json()
  const supabase = createServiceClient()

  const { data: created, error } = await supabase
    .from("produtos")
    .insert(produto)
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (variacoes?.length) {
    const rows = variacoes.map((v: { tamanho: string; quantidade: number }) => ({
      produto_id: created.id,
      tamanho: v.tamanho,
      quantidade_total: v.quantidade,
      quantidade_disponivel: v.quantidade,
    }))
    const { error: ve } = await supabase.from("variacoes_estoque").insert(rows)
    if (ve) return NextResponse.json({ error: ve.message }, { status: 500 })
  }

  return NextResponse.json({ id: created.id })
}
