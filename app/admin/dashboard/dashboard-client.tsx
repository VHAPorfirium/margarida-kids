"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

/* ── types ── */
export interface PedidoResumo {
  id: string
  cliente_nome: string
  total: number
  status: string
  criado_em: string
  items: Array<{ name: string; size: string; qty: number; price: number }>
}

export interface WeekDay { day: string; val: number }

export interface DonutSlice { label: string; val: number; color: string }

export interface LowStockItem {
  produto_id: string
  produto_nome: string | null
  tamanho: string
  quantidade_disponivel: number
}

/* ── Bar chart ── */
function BarChart({ data }: { data: WeekDay[] }) {
  const max = Math.max(...data.map((d) => d.val), 1)
  const H = 80
  const today = new Date().getDay() // 0=Sun
  const dayMap: Record<number, string> = { 0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb" }
  const todayLabel = dayMap[today]

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: H + 24, paddingBottom: 24, position: "relative" }}>
      {data.map((d) => {
        const h = Math.max(Math.round((d.val / max) * H), d.val > 0 ? 4 : 0)
        const isToday = d.day === todayLabel
        return (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
            {d.val > 0 && (
              <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? "#F472B6" : "#A8A29E" }}>
                {d.val >= 1000 ? (d.val / 1000).toFixed(1) + "k" : `R$${d.val}`}
              </div>
            )}
            <div style={{ width: "100%", height: h, background: isToday ? "#F472B6" : "#EDE8EA", borderRadius: "3px 3px 0 0", transition: "height .3s", minHeight: 2 }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? "#1C1917" : "#A8A29E", position: "absolute", bottom: 0 }}>{d.day}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Donut chart ── */
function StatusDonut({ data }: { data: DonutSlice[] }) {
  const total = data.reduce((s, d) => s + d.val, 0)
  const R = 36, cx = 44, cy = 44, circ = 2 * Math.PI * R
  let offset = 0
  const slices = data.map((d) => {
    const dash = total > 0 ? (d.val / total) * circ : 0
    const gap = circ - dash
    const s = { ...d, dash, gap, offset }
    offset += dash
    return s
  })

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width="88" height="88" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F5F5F4" strokeWidth="12" />
        {total > 0 && slices.map((s) => (
          <circle key={s.label} cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth="12"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={circ / 4 - s.offset} />
        ))}
        <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 14, fill: "#1C1917" }}>{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle"
          style={{ fontFamily: "Nunito, sans-serif", fontWeight: 600, fontSize: 8, fill: "#A8A29E" }}>pedidos</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.filter((d) => d.val > 0).map((d) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#78716C", fontWeight: 600 }}>{d.label}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#1C1917", marginLeft: "auto" }}>{d.val}</span>
          </div>
        ))}
        {total === 0 && <span style={{ fontSize: 12, color: "#A8A29E" }}>Sem pedidos</span>}
      </div>
    </div>
  )
}

/* ── Main client component ── */
interface Props {
  pendingOrders: PedidoResumo[]
  recentOrders: PedidoResumo[]
  weekData: WeekDay[]
  donutData: DonutSlice[]
  lowStock: LowStockItem[]
  metrics: { label: string; value: string; sub: string; subColor: string; border: string; bg?: string }[]
  saudacao: string
  dataFormatada: string
}

export function DashboardClient({
  pendingOrders: initialPending,
  recentOrders,
  weekData,
  donutData,
  lowStock,
  metrics: initialMetrics,
  saudacao,
  dataFormatada,
}: Props) {
  const [pending, setPending] = useState(initialPending)
  const [confirming, setConfirming] = useState<string | null>(null)

  async function confirmOrder(id: string) {
    setConfirming(id)
    const supabase = createClient()
    await supabase.from("pedidos").update({ status: "confirmado" }).eq("id", id)
    setPending((prev) => prev.filter((p) => p.id !== id))
    setConfirming(null)
  }

  const metrics = initialMetrics.map((m, i) =>
    i === 2 ? { ...m, value: pending.length.toString() } : m
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "inherit" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917" }}>{saudacao}, Margarida 👋</h1>
        <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 2, textTransform: "capitalize" }}>{dataFormatada}</p>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: m.bg ?? "#fff", border: `1px solid ${m.border}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#78716C", marginBottom: 6, lineHeight: 1.4 }}>{m.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: m.subColor }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Receita semanal</div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}>Últimos 7 dias</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#F472B6" }}>
              {weekData.reduce((s, d) => s + d.val, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
          <BarChart data={weekData} />
        </div>
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Pedidos por status</div>
          <div style={{ fontSize: 11, color: "#A8A29E", marginBottom: 16 }}>Total do mês</div>
          <StatusDonut data={donutData} />
        </div>
      </div>

      {/* Bottom cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Pending orders */}
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Aguardando confirmação</span>
            {pending.length > 0 && (
              <span style={{ background: "#FEF9C3", color: "#92400E", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>
                {pending.length} pendente{pending.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div>
            {pending.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center", color: "#A8A29E" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Tudo em dia 🎉</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Nenhum pedido pendente</div>
              </div>
            ) : pending.map((p) => {
              const summary = p.items.map((i) => `${i.name.split(" ").slice(0, 2).join(" ")} (${i.size})`).join(", ")
              const time = new Date(p.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              return (
                <div key={p.id} style={{ padding: "11px 18px", borderBottom: "1px solid #F5F0F2", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{p.cliente_nome}</span>
                      <span style={{ fontSize: 11, color: "#A8A29E" }}>· {time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#78716C", marginBottom: 6, lineHeight: 1.5 }}>{summary || "—"}</div>
                    <div style={{ fontWeight: 800, color: "#F472B6", fontSize: 13 }}>
                      {p.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                    <button
                      onClick={() => confirmOrder(p.id)}
                      disabled={confirming === p.id}
                      style={{
                        background: "#16A34A", color: "#fff", border: "none", borderRadius: 6,
                        padding: "7px 14px", fontFamily: "inherit", fontWeight: 700, fontSize: 12,
                        cursor: "pointer", opacity: confirming === p.id ? 0.6 : 1,
                      }}>
                      {confirming === p.id ? "…" : "Confirmar"}
                    </button>
                    <Link href="/admin/pedidos" style={{ textAlign: "center", fontSize: 12, color: "#78716C", fontWeight: 600, textDecoration: "none" }}>
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ padding: "12px 18px", borderTop: "1px solid #EDE8EA" }}>
            <Link href="/admin/pedidos" style={{ fontSize: 13, color: "#F472B6", fontWeight: 700, textDecoration: "none" }}>
              Ver todos os pedidos →
            </Link>
          </div>
        </div>

        {/* Low stock */}
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Estoque baixo</span>
            {lowStock.length > 0 && (
              <span style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>
                {lowStock.length} {lowStock.length === 1 ? "variação" : "variações"}
              </span>
            )}
          </div>
          <div>
            {lowStock.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center", color: "#A8A29E" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Tudo em ordem 🎉</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Sem variações com estoque crítico</div>
              </div>
            ) : lowStock.map((v, i) => (
              <div key={`${v.produto_id}-${v.tamanho}`} style={{ padding: "11px 18px", borderBottom: i < lowStock.length - 1 ? "1px solid #F5F0F2" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: "1px solid #EDE8EA" }}>
                  👗
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.produto_nome ?? "Produto"}</div>
                  <div style={{ fontSize: 12, color: "#A8A29E" }}>Tam. {v.tamanho}</div>
                </div>
                <span style={{ background: "#FEF9C3", color: "#92400E", borderRadius: 4, padding: "2px 9px", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                  {v.quantidade_disponivel} un.
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Pedidos recentes</span>
            <Link href="/admin/pedidos" style={{ fontSize: 12, color: "#F472B6", fontWeight: 700, textDecoration: "none" }}>Ver todos</Link>
          </div>
          <div>
            {recentOrders.map((o, i) => {
              const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
                aguardando: { label: "Aguardando", bg: "#FEF9C3", color: "#92400E", dot: "#FBBF24" },
                confirmado:  { label: "Confirmado", bg: "#EFF6FF", color: "#1D4ED8", dot: "#60A5FA" },
                separacao:   { label: "Separação",  bg: "#FAF5FF", color: "#7C3AED", dot: "#A78BFA" },
                enviado:     { label: "Enviado",    bg: "#FFF7ED", color: "#C2410C", dot: "#FB923C" },
                entregue:    { label: "Entregue",   bg: "#F0FDF4", color: "#16A34A", dot: "#4ADE80" },
                cancelado:   { label: "Cancelado",  bg: "#F5F5F4", color: "#78716C", dot: "#A8A29E" },
              }
              const st = STATUS_META[o.status] ?? STATUS_META.aguardando
              const date = new Date(o.criado_em).toLocaleDateString("pt-BR")
              return (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: i < recentOrders.length - 1 ? "1px solid #F5F0F2" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{o.cliente_nome}</div>
                    <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}>{date}</div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: st.bg, borderRadius: 4, padding: "2px 8px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#F472B6", flexShrink: 0 }}>
                    {o.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA novo produto */}
      <div style={{
        background: "linear-gradient(135deg,#FDF2F8 0%,#F5F0FF 100%)",
        border: "1px solid #EDE8EA", borderRadius: 10, padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1C1917" }}>Pronto para cadastrar um novo produto?</div>
          <div style={{ fontSize: 12, color: "#78716C", marginTop: 4 }}>Adicione fotos, tamanhos e o produto já aparece no catálogo.</div>
        </div>
        <Link href="/admin/produtos/novo" style={{
          background: "#1C1917", color: "#fff", borderRadius: 6, padding: "9px 16px",
          fontWeight: 700, fontSize: 13, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo produto
        </Link>
      </div>
    </div>
  )
}
