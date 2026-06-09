import Image from "next/image"
import Link from "next/link"
import { ImageOff } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import type { Produto, StatusProduto } from "@/lib/types"
import { StatusSelect } from "./status-select"

const STATUS_META: Record<StatusProduto, { label: string; bg: string; color: string; dot: string }> = {
  disponivel: { label: "Disponível", bg: "#F0FDF4", color: "#16A34A", dot: "#22C55E" },
  esgotado:   { label: "Esgotado",   bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
  inativo:    { label: "Inativo",    bg: "#F5F5F4", color: "#78716C", dot: "#A8A29E" },
}

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

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Lista de produtos</span>
          <span style={{ fontSize: 12, color: "#A8A29E", fontWeight: 600 }}>{total} {total === 1 ? "item" : "itens"}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead>
              <tr>
                {["Produto", "Gênero", "Estação", "Coleção", "Status", ""].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "10px 14px",
                    fontSize: 11, fontWeight: 700, color: "#A8A29E",
                    textTransform: "uppercase", letterSpacing: "0.5px",
                    background: "#FAFAF9", borderBottom: "1px solid #EDE8EA",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((produto) => {
                const st = STATUS_META[produto.status]
                return (
                  <tr key={produto.id}>
                    <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", fontSize: 13, verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {produto.fotos?.[0] ? (
                          <Image
                            src={produto.fotos[0]} alt={produto.nome}
                            width={38} height={38}
                            style={{ borderRadius: 8, border: "1px solid #EDE8EA", objectFit: "cover", flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{
                            width: 38, height: 38, borderRadius: 8,
                            background: "#FDF2F8", border: "1px solid #EDE8EA",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <ImageOff size={14} color="#A8A29E" />
                          </div>
                        )}
                        <span style={{ fontWeight: 600 }}>{produto.nome}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", fontSize: 13, color: "#78716C", verticalAlign: "middle", textTransform: "capitalize" }}>
                      {produto.genero}
                    </td>
                    <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", fontSize: 13, color: "#78716C", verticalAlign: "middle", textTransform: "capitalize" }}>
                      {produto.estacao ?? "—"}
                    </td>
                    <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", fontSize: 13, color: "#78716C", verticalAlign: "middle" }}>
                      {produto.colecao ?? "—"}
                    </td>
                    <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", verticalAlign: "middle" }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: st.bg, borderRadius: 5, padding: "3px 10px",
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0 }}/>
                        <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", verticalAlign: "middle" }}>
                      <StatusSelect produtoId={produto.id} statusAtual={produto.status} />
                    </td>
                  </tr>
                )
              })}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 14px", textAlign: "center", color: "#A8A29E", fontSize: 13 }}>
                    Nenhum produto cadastrado.{" "}
                    <Link href="/admin/produtos/novo" style={{ color: "#F472B6", fontWeight: 700, textDecoration: "none" }}>
                      Cadastrar agora →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
