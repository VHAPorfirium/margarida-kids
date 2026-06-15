import { redirect } from "next/navigation"
import { lerSessao } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { HistoricoClient } from "./historico-client"

export default async function MeuHistoricoPage() {
  const telefone = await lerSessao()

  if (!telefone) redirect("/login")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: account }, { data: pedidosData }] = await Promise.all([
    supabase.from("customer_accounts").select("nome").eq("telefone", telefone).single(),
    supabase.from("pedidos").select("id, items, total, status, tipo, criado_em").eq("cliente_telefone", telefone).order("criado_em", { ascending: false }),
  ])

  return (
    <HistoricoClient
      nome={account?.nome ?? ""}
      pedidos={pedidosData ?? []}
    />
  )
}
