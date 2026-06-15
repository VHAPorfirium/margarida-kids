import { createClient } from "@/lib/supabase/server"
import type { ProdutoComVariacoes } from "@/lib/types"
import { CatalogoClient } from "@/app/catalogo-client"
import { lerSessao } from "@/lib/auth"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export default async function CatalogoPage() {
  const [supabase, telefone] = await Promise.all([
    createClient(),
    lerSessao(),
  ])

  const { data } = await supabase
    .from("produtos")
    .select("*, variacoes_estoque(*)")
    .eq("status", "disponivel")
    .order("criado_em", { ascending: false })

  const produtos = (data ?? []) as ProdutoComVariacoes[]

  let nomeCliente = ""
  if (telefone) {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: acc } = await service
      .from("customer_accounts")
      .select("nome")
      .eq("telefone", telefone)
      .single()
    nomeCliente = acc?.nome ?? ""
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9", fontFamily: "var(--font-nunito, Nunito, sans-serif)" }}>
      <CatalogoClient produtos={produtos} nomeCliente={nomeCliente} telefoneSessao={telefone ?? ""} />
    </div>
  )
}
