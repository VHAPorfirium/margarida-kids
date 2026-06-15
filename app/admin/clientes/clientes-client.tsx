"use client"

import { useState, useMemo } from "react"

interface Cliente {
  id: string
  nome: string
  telefone: string
  criado_em: string
}

interface ItemPedido {
  nome: string
  tamanho: string
  quantidade?: number
  qty?: number
  preco: number
}

interface Pedido {
  id: string
  cliente_nome: string
  cliente_telefone: string
  items: ItemPedido[]
  total: number
  status: string
  tipo: string
  criado_em: string
}

const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  aguardando:    { label: "Aguardando",    bg: "#FEF9C3", color: "#92400E", dot: "#FBBF24" },
  confirmado:    { label: "Confirmado",    bg: "#EFF6FF", color: "#1D4ED8", dot: "#60A5FA" },
  separacao:     { label: "Separação",     bg: "#F3E8FF", color: "#6D28D9", dot: "#A78BFA" },
  entregue:      { label: "Entregue",      bg: "#F0FDF4", color: "#16A34A", dot: "#4ADE80" },
  cancelado:     { label: "Cancelado",     bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
  cf_separado:   { label: "CF Separado",   bg: "#F3E8FF", color: "#6D28D9", dot: "#A78BFA" },
  cf_entregue:   { label: "CF Entregue",   bg: "#F0FDF4", color: "#16A34A", dot: "#4ADE80" },
  cf_aguardando: { label: "CF Aguardando", bg: "#FEF9C3", color: "#92400E", dot: "#FBBF24" },
  cf_pago:       { label: "CF Pago",       bg: "#F0FDF4", color: "#15803D", dot: "#34D399" },
  cf_devolvido:  { label: "CF Devolvido",  bg: "#F5F5F4", color: "#78716C", dot: "#A8A29E" },
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("pt-BR")
}

function maskTel(t: string) {
  const d = t.replace(/\D/g, "")
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
}

/* ─── Modal histórico do cliente ─────────────────────────────────────────── */
function ClienteModal({
  cliente,
  pedidos,
  onClose,
}: {
  cliente: Cliente
  pedidos: Pedido[]
  onClose: () => void
}) {
  const total = pedidos.reduce((s, p) => s + p.total, 0)
  const entregues = pedidos.filter((p) => p.status === "entregue" || p.status === "cf_entregue").length

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200 }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", zIndex: 201,
        background: "#fff", borderRadius: 14,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        width: "min(560px, 94vw)", maxHeight: "88vh",
        display: "flex", flexDirection: "column",
        fontFamily: "inherit",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 22px 16px", borderBottom: "1px solid #EDE8EA",
          display: "flex", alignItems: "flex-start", gap: 14, flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "#F472B6", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 17, flexShrink: 0,
          }}>
            {cliente.nome[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1C1917" }}>{cliente.nome}</div>
            <div style={{ fontSize: 13, color: "#78716C", marginTop: 2 }}>{maskTel(cliente.telefone)}</div>
            <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}>
              Cliente desde {fmtDate(cliente.criado_em)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#F5F5F4", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#78716C", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            }}
          >X</button>
        </div>

        {/* Métricas */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 1, background: "#EDE8EA", borderBottom: "1px solid #EDE8EA", flexShrink: 0,
        }}>
          {[
            { label: "Pedidos", value: String(pedidos.length) },
            { label: "Entregues", value: String(entregues) },
            { label: "Total gasto", value: fmt(total) },
          ].map((m) => (
            <div key={m.label} style={{ background: "#FAFAF9", padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#1C1917" }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Lista de pedidos */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {pedidos.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#A8A29E" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Nenhum pedido ainda</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Este cliente ainda não fez pedidos</div>
            </div>
          ) : pedidos.map((p, i) => {
            const st = STATUS_META[p.status] ?? STATUS_META.aguardando
            const resumo = p.items.map((it) =>
              `${it.nome.split(" ").slice(0, 3).join(" ")} (${it.tamanho})`
            ).join(", ")
            return (
              <div
                key={p.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 22px",
                  borderBottom: i < pedidos.length - 1 ? "1px solid #F5F0F2" : "none",
                }}
              >
                {/* data + tipo */}
                <div style={{ flexShrink: 0, width: 70 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1917" }}>{fmtDate(p.criado_em)}</div>
                  <div style={{
                    marginTop: 3, display: "inline-block",
                    fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.4px", padding: "1px 5px", borderRadius: 3,
                    background: p.tipo === "confianca" ? "#F3E8FF" : "#EFF6FF",
                    color: p.tipo === "confianca" ? "#6D28D9" : "#1D4ED8",
                  }}>
                    {p.tipo === "confianca" ? "Confiança" : "Normal"}
                  </div>
                </div>

                {/* resumo items */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#44403C", lineHeight: 1.5 }}>{resumo || "—"}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#F472B6", marginTop: 4 }}>
                    {fmt(p.total)}
                  </div>
                </div>

                {/* status badge */}
                <div style={{
                  flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5,
                  background: st.bg, borderRadius: 4, padding: "3px 8px",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer WhatsApp */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid #EDE8EA", flexShrink: 0 }}>
          <a
            href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px", borderRadius: 8, background: "#25D366",
              color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contatar no WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export function ClientesClient({
  clientes,
  pedidos,
}: {
  clientes: Cliente[]
  pedidos: Pedido[]
}) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Cliente | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.telefone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    )
  }, [clientes, search])

  function pedidosDoCliente(c: Cliente) {
    return pedidos.filter((p) => p.cliente_telefone === c.telefone)
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917", margin: 0 }}>Clientes</h1>
          <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 4 }}>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} cadastrado{clientes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Busca */}
        <div style={{ position: "relative" }}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#A8A29E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              border: "1px solid #EDE8EA", borderRadius: 8,
              fontFamily: "inherit", fontSize: 13, color: "#1C1917",
              background: "#FAFAF9", outline: "none", width: 240,
            }}
          />
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {/* Cabeçalho */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 130px 70px 80px",
          padding: "10px 20px", background: "#FAFAF9", borderBottom: "1px solid #EDE8EA",
        }}>
          {["Cliente", "Telefone", "Pedidos", "Total gasto"].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Linhas */}
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#A8A29E" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Nenhum cliente encontrado</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Tente buscar com outros termos</div>
          </div>
        ) : filtered.map((c, i) => {
          const peds = pedidosDoCliente(c)
          const totalGasto = peds.reduce((s, p) => s + p.total, 0)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c)}
              style={{
                display: "grid", gridTemplateColumns: "1fr 130px 70px 80px",
                width: "100%", textAlign: "left", fontFamily: "inherit",
                padding: "13px 20px", background: "#fff", border: "none",
                borderBottom: i < filtered.length - 1 ? "1px solid #F5F0F2" : "none",
                cursor: "pointer", transition: "background 0.1s",
                alignItems: "center",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAF9" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff" }}
            >
              {/* Nome + data */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", background: "#FDF2F8",
                  border: "1px solid #FBCFE8", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#F472B6", fontWeight: 800,
                  fontSize: 13, flexShrink: 0,
                }}>
                  {c.nome[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1C1917" }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 1 }}>
                    Desde {fmtDate(c.criado_em)}
                  </div>
                </div>
              </div>

              {/* Telefone */}
              <div style={{ fontSize: 13, color: "#78716C" }}>{maskTel(c.telefone)}</div>

              {/* Pedidos */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1917" }}>
                {peds.length}
              </div>

              {/* Total */}
              <div style={{ fontSize: 13, fontWeight: 800, color: "#F472B6" }}>
                {totalGasto > 0 ? fmt(totalGasto) : "—"}
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <ClienteModal
          cliente={selected}
          pedidos={pedidosDoCliente(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
