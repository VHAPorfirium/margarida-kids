import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const supabase = createServiceClient()
  const [{ data: variacoes }, { data: produtos }] = await Promise.all([
    supabase.from("variacoes_estoque").select("*").order("produto_id"),
    supabase.from("produtos").select("id,nome,status,fotos,genero,estacao,variacoes_estoque(*)").order("nome"),
  ])
  return NextResponse.json({ variacoes: variacoes ?? [], produtos: produtos ?? [] })
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { id, quantidade_disponivel } = await req.json()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("variacoes_estoque")
    .update({ quantidade_disponivel })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
