import Link from "next/link"
import { createServiceClient as createClient } from "@/lib/supabase/service"
import type { Produto } from "@/lib/types"
import { ProdutosTable } from "./produtos-client"

export default async function ProdutosPage() {
  const supabase = await createClient()
  const { data: produtos } = await supabase
    .from("produtos")
    .select("*")
    .order("criado_em", { ascending: false })

  const lista = (produtos ?? []) as Produto[]
  const total = lista.length
  const disponiveis = lista.filter((p) => p.status === "disponivel").length
  const esgotados   = lista.filter((p) => p.status === "esgotado").length
  const inativos    = lista.filter((p) => p.status === "inativo").length

  const summaries = [
    { label: "Total",       value: total,       color: "#F472B6" },
    { label: "Disponíveis", value: disponiveis, color: "#16A34A" },
    { label: "Esgotados",   value: esgotados,   color: "#DC2626" },
    { label: "Inativos",    value: inativos,    color: "#A8A29E" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917" }}>Produtos</h1>
          <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 2 }}>Gerencie seu catálogo</p>
        </div>
        <Link href="/admin/produtos/novo" style={{
          background: "#1C1917", color: "#fff", border: "none",
          borderRadius: 6, padding: "9px 16px",
          fontWeight: 700, fontSize: 13, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          textDecoration: "none",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo produto
        </Link>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {summaries.map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontWeight: 800, fontSize: 28, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: "#78716C", fontSize: 12, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table with search */}
      <ProdutosTable lista={lista} />
    </div>
  )
}
