import { createClient as serviceClient } from "@supabase/supabase-js"
import { ClientesClient } from "./clientes-client"

function getService() {
  return serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function ClientesPage() {
  const supabase = getService()

  const { data: clientes } = await supabase
    .from("customer_accounts")
    .select("id, nome, telefone, criado_em")
    .order("criado_em", { ascending: false })

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, cliente_nome, cliente_telefone, items, total, status, tipo, criado_em")
    .order("criado_em", { ascending: false })

  return (
    <ClientesClient
      clientes={(clientes ?? []) as { id: string; nome: string; telefone: string; criado_em: string }[]}
      pedidos={(pedidos ?? []) as {
        id: string; cliente_nome: string; cliente_telefone: string
        items: { nome: string; tamanho: string; quantidade?: number; qty?: number; preco: number }[]
        total: number; status: string; tipo: string; criado_em: string
      }[]}
    />
  )
}
