import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  // Requer autenticação de admin — dados de clientes são sensíveis (PII)
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const q = req.nextUrl.searchParams.get("q") ?? ""

  // Mínimo 2 chars, máximo 100
  if (q.length < 2 || q.length > 100) return NextResponse.json([])

  // Sanitiza a query — remove caracteres que não fazem sentido numa busca
  const qClean = q.replace(/[%_\\]/g, "\\$&").trim()

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from("customer_accounts")
    .select("id, nome, telefone")
    .or(`nome.ilike.%${qClean}%,telefone.ilike.%${qClean}%`)
    .limit(8)

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}
