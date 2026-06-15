import { createServiceClient as createClient } from "@/lib/supabase/service"
import Link from "next/link"
import type { ProdutoComVariacoes } from "@/lib/types"
import { NovoPedidoForm } from "./novo-pedido-client"

export default async function NovoPedidoPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("produtos")
    .select("*, variacoes_estoque(*)")
    .eq("status", "disponivel")
    .order("nome")

  const produtos = (data ?? []) as ProdutoComVariacoes[]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link
          href="/admin/pedidos"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#78716C",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            padding: "8px 0",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Voltar
        </Link>
        <div style={{ width: 1, height: 20, background: "#EDE8EA" }} />
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917" }}>Novo pedido</h1>
          <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 2 }}>Registre um pedido manualmente</p>
        </div>
      </div>

      <NovoPedidoForm produtos={produtos} />
    </div>
  )
}
