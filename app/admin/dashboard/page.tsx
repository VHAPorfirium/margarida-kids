import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: pedidos },
    { data: variacoes },
    { data: produtos },
  ] = await Promise.all([
    supabase.from("pedidos").select("*").order("criado_em", { ascending: false }),
    supabase.from("variacoes_estoque").select("produto_id,tamanho,quantidade_disponivel"),
    supabase.from("produtos").select("id,nome"),
  ])

  const now = new Date()
  const saudacao = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite"
  const dataFormatada = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  return (
    <DashboardClient
      allPedidos={(pedidos ?? []) as Record<string, unknown>[]}
      variacoes={(variacoes ?? []) as { produto_id: string; tamanho: string; quantidade_disponivel: number }[]}
      produtos={(produtos ?? []) as { id: string; nome: string }[]}
      saudacao={saudacao}
      dataFormatada={dataFormatada}
    />
  )
}
