"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

/* ════════════════════════════════════════════
   TYPES
════════════════════════════════════════════ */
interface Pedido {
  id: string; cliente_nome: string; cliente_telefone: string
  total: number; status: string; tipo: string; items: ItemPedido[]; criado_em: string
}
interface ItemPedido { nome: string; tamanho: string; quantidade: number; preco: number }

export interface WeekDay { day: string; val: number }
export interface DonutSlice { label: string; val: number; color: string }
export interface LowStockItem { produto_id: string; produto_nome: string | null; tamanho: string; quantidade_disponivel: number }
// Legacy exports kept for compatibility
export interface PedidoResumo { id: string; cliente_nome: string; total: number; status: string; criado_em: string; items: ItemPedido[] }

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }

function toLocalDate(s: string) {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function toLocalMonth(s: string) {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function filterPedidos(pedidos: Pedido[], filterDay: string, filterMonth: string): Pedido[] {
  if (filterDay) return pedidos.filter((p) => toLocalDate(p.criado_em) === filterDay)
  if (filterMonth) return pedidos.filter((p) => toLocalMonth(p.criado_em) === filterMonth)
  return pedidos
}

/* ════════════════════════════════════════════
   BAR CHART
════════════════════════════════════════════ */
function BarChart({ data, label }: { data: { key: string; val: number; highlight?: boolean }[]; label?: string }) {
  const max = Math.max(...data.map((d) => d.val), 1)
  const H = 80
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: H + 28, paddingBottom: 24, position: "relative" }}>
      {data.map((d) => {
        const h = Math.max(Math.round((d.val / max) * H), d.val > 0 ? 4 : 0)
        return (
          <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
            {d.val > 0 && (
              <div style={{ fontSize: 9, fontWeight: 700, color: d.highlight ? "#F472B6" : "#A8A29E", textAlign: "center" }}>
                {d.val >= 1000 ? (d.val / 1000).toFixed(1) + "k" : `R$${d.val}`}
              </div>
            )}
            <div style={{ width: "100%", height: h, background: d.highlight ? "#F472B6" : "#EDE8EA", borderRadius: "3px 3px 0 0", transition: "height .3s", minHeight: 2 }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: d.highlight ? "#1C1917" : "#A8A29E", position: "absolute", bottom: 0, textAlign: "center" }}>{d.key}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════
   DONUT CHART
════════════════════════════════════════════ */
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
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={circ / 4 - s.offset} />
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

/* ════════════════════════════════════════════
   DATE FILTER BAR
════════════════════════════════════════════ */
function DateFilterBar({ filterDay, filterMonth, onDayChange, onMonthChange, onClear }:
  { filterDay: string; filterMonth: string; onDayChange: (v: string) => void; onMonthChange: (v: string) => void; onClear: () => void }) {
  const hasFilter = !!filterDay || !!filterMonth
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#78716C" }}>Filtrar:</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <label style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600 }}>Dia</label>
        <input type="date" value={filterDay} onChange={(e) => { onDayChange(e.target.value); if (e.target.value) onMonthChange("") }}
          style={{ padding: "5px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", background: filterDay ? "#FDF2F8" : "#fff", color: filterDay ? "#F472B6" : "#1C1917", fontWeight: filterDay ? 700 : 400 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <label style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600 }}>Mes</label>
        <input type="month" value={filterMonth} onChange={(e) => { onMonthChange(e.target.value); if (e.target.value) onDayChange("") }}
          style={{ padding: "5px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", background: filterMonth ? "#FDF2F8" : "#fff", color: filterMonth ? "#F472B6" : "#1C1917", fontWeight: filterMonth ? 700 : 400 }} />
      </div>
      {hasFilter && (
        <button onClick={onClear}
          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Limpar
        </button>
      )}
      {hasFilter && (
        <span style={{ fontSize: 11, color: "#F472B6", fontWeight: 700, background: "#FDF2F8", padding: "4px 10px", borderRadius: 6 }}>
          {filterDay ? `Dia ${new Date(filterDay + "T12:00:00").toLocaleDateString("pt-BR")}` : `Mes ${filterMonth?.split("-").reverse().join("/")}`}
        </span>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   COMPUTE METRICS
════════════════════════════════════════════ */
function computeMetrics(pedidos: Pedido[], filterDay: string, filterMonth: string) {
  const now = new Date()

  // Scope: filtered pedidos
  const scoped = filterPedidos(pedidos, filterDay, filterMonth)

  // If no filter, default scope = current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const defaultScoped = pedidos.filter((p) => p.criado_em >= startOfMonth)
  const active = (filterDay || filterMonth) ? scoped : defaultScoped

  const receitaNormal = active.filter((p) => (p.tipo === "normal" || !p.tipo) && p.status !== "cancelado").reduce((s, p) => s + (p.total ?? 0), 0)
  const receitaConfianca = active.filter((p) => p.tipo === "confianca" && p.status === "cf_pago").reduce((s, p) => s + (p.total ?? 0), 0)
  const receitaMes = receitaNormal + receitaConfianca
  const aReceber = pedidos.filter((p) => p.tipo === "confianca" && (p.status === "cf_entregue" || p.status === "cf_aguardando")).reduce((s, p) => s + (p.total ?? 0), 0)
  const pendingOrders = pedidos.filter((p) => p.status === "aguardando")

  // Bar chart data
  let barData: { key: string; val: number; highlight?: boolean }[] = []
  if (filterDay) {
    // hourly buckets
    const hours = ["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"]
    const buckets: Record<string, number> = {}
    hours.forEach((h) => { buckets[h] = 0 })
    scoped.forEach((p) => {
      const h = new Date(p.criado_em).getHours()
      const bucket = hours[Math.floor(h / 4)]
      const isNormalPaid = (p.tipo === "normal" || !p.tipo) && p.status !== "cancelado"
      const isCfPaid = p.tipo === "confianca" && p.status === "cf_pago"
      if (isNormalPaid || isCfPaid) buckets[bucket] = (buckets[bucket] ?? 0) + (p.total ?? 0)
    })
    const nowHour = now.getHours()
    barData = hours.map((k) => ({ key: k, val: Math.round(buckets[k]), highlight: Math.floor(nowHour / 4) === hours.indexOf(k) && toLocalDate(now.toISOString()) === filterDay }))
  } else if (filterMonth) {
    // weekly buckets within the month
    const [yr, mo] = filterMonth.split("-").map(Number)
    const daysInMonth = new Date(yr, mo, 0).getDate()
    const weeks: { key: string; start: number; end: number }[] = []
    for (let d = 1; d <= daysInMonth; d += 7) {
      const end = Math.min(d + 6, daysInMonth)
      weeks.push({ key: `${d}-${end}`, start: d, end })
    }
    const buckets: Record<string, number> = {}
    weeks.forEach((w) => { buckets[w.key] = 0 })
    scoped.forEach((p) => {
      const day = new Date(p.criado_em).getDate()
      const week = weeks.find((w) => day >= w.start && day <= w.end)
      const isNormalPaid = (p.tipo === "normal" || !p.tipo) && p.status !== "cancelado"
      const isCfPaid = p.tipo === "confianca" && p.status === "cf_pago"
      if (week && (isNormalPaid || isCfPaid)) buckets[week.key] = (buckets[week.key] ?? 0) + (p.total ?? 0)
    })
    const todayDay = now.getDate()
    barData = weeks.map((w) => ({ key: w.key, val: Math.round(buckets[w.key]), highlight: todayDay >= w.start && todayDay <= w.end && toLocalMonth(now.toISOString()) === filterMonth }))
  } else {
    // last 7 days
    const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
    const weekMap: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i)
      weekMap[dayLabels[d.getDay()]] = 0
    }
    pedidos.forEach((p) => {
      const isNormalPaid = (p.tipo === "normal" || !p.tipo) && p.status !== "cancelado"
      const isCfPaid = p.tipo === "confianca" && p.status === "cf_pago"
      if (!isNormalPaid && !isCfPaid) return
      const d = new Date(p.criado_em)
      if (Math.floor((now.getTime() - d.getTime()) / 86400000) <= 6) {
        const label = dayLabels[d.getDay()]
        weekMap[label] = (weekMap[label] ?? 0) + (p.total ?? 0)
      }
    })
    const todayLabel = dayLabels[now.getDay()]
    barData = Object.entries(weekMap).map(([key, val]) => ({ key, val: Math.round(val), highlight: key === todayLabel }))
  }

  // Donut
  const STATUS_DONUT = [
    { status: "entregue",     label: "Entregues",       color: "#22C55E" },
    { status: "enviado",      label: "Enviados",         color: "#F97316" },
    { status: "separacao",    label: "Separacao",        color: "#A78BFA" },
    { status: "confirmado",   label: "Confirmados",      color: "#60A5FA" },
    { status: "aguardando",   label: "Aguardando",       color: "#FCD34D" },
    { status: "cf_pago",      label: "Confianca pago",   color: "#34D399" },
    { status: "cf_aguardando",label: "Conf. a receber",  color: "#FDE68A" },
  ]
  const donutData: DonutSlice[] = STATUS_DONUT.map(({ status, label, color }) => ({
    label, color, val: active.filter((p) => p.status === status).length,
  }))

  const periodLabel = filterDay
    ? `Dia ${new Date(filterDay + "T12:00:00").toLocaleDateString("pt-BR")}`
    : filterMonth
      ? `Mes ${filterMonth.split("-").reverse().join("/")}`
      : "Mes atual"

  const barSubLabel = filterDay ? "Por hora" : filterMonth ? "Por semana" : "Ultimos 7 dias"

  return { receitaMes, aReceber, pendingOrders, barData, donutData, active, periodLabel, barSubLabel }
}

/* ════════════════════════════════════════════
   MAIN CLIENT COMPONENT
════════════════════════════════════════════ */
interface Props {
  allPedidos: Record<string, unknown>[]
  variacoes: { produto_id: string; tamanho: string; quantidade_disponivel: number }[]
  produtos: { id: string; nome: string }[]
  saudacao: string
  dataFormatada: string
}

export function DashboardClient({ allPedidos, variacoes, produtos, saudacao, dataFormatada }: Props) {
  const [filterDay, setFilterDay] = useState("")
  const [filterMonth, setFilterMonth] = useState("")
  const [confirming, setConfirming] = useState<string | null>(null)
  const [localPedidos, setLocalPedidos] = useState<Pedido[]>(allPedidos as unknown as Pedido[])

  const { receitaMes, aReceber, pendingOrders, barData, donutData, active, periodLabel, barSubLabel } = useMemo(
    () => computeMetrics(localPedidos, filterDay, filterMonth),
    [localPedidos, filterDay, filterMonth]
  )

  async function confirmOrder(id: string) {
    setConfirming(id)
    const supabase = createClient()
    await supabase.from("pedidos").update({ status: "confirmado" }).eq("id", id)
    setLocalPedidos((prev) => prev.map((p) => p.id === id ? { ...p, status: "confirmado" } : p))
    setConfirming(null)
  }

  // Low stock (not affected by date filter)
  const prodMap = Object.fromEntries(produtos.map((p) => [p.id, p.nome]))
  const lowStock: LowStockItem[] = variacoes
    .filter((v) => v.quantidade_disponivel > 0 && v.quantidade_disponivel <= 3)
    .slice(0, 6)
    .map((v) => ({ produto_id: v.produto_id, produto_nome: prodMap[v.produto_id] ?? null, tamanho: v.tamanho, quantidade_disponivel: v.quantidade_disponivel }))

  // Recent orders (affected by filter)
  const recentOrders = active.slice(0, 5)

  const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    aguardando: { label: "Aguardando", bg: "#FEF9C3", color: "#92400E", dot: "#FBBF24" },
    confirmado: { label: "Confirmado", bg: "#EFF6FF", color: "#1D4ED8", dot: "#60A5FA" },
    separacao:  { label: "Separacao",  bg: "#FAF5FF", color: "#7C3AED", dot: "#A78BFA" },
    enviado:    { label: "Enviado",    bg: "#FFF7ED", color: "#C2410C", dot: "#FB923C" },
    entregue:   { label: "Entregue",   bg: "#F0FDF4", color: "#16A34A", dot: "#4ADE80" },
    cancelado:  { label: "Cancelado",  bg: "#F5F5F4", color: "#78716C", dot: "#A8A29E" },
    cf_pago:    { label: "CF Pago",    bg: "#F0FDF4", color: "#15803D", dot: "#34D399" },
    cf_separado: { label: "CF Sep.",   bg: "#F3E8FF", color: "#6D28D9", dot: "#A78BFA" },
    cf_entregue: { label: "CF Entregue", bg: "#FFF7ED", color: "#C2410C", dot: "#F97316" },
    cf_aguardando: { label: "CF Aguard.", bg: "#FEF9C3", color: "#92400E", dot: "#FBBF24" },
    cf_devolvido: { label: "CF Dev.",  bg: "#F5F5F4", color: "#78716C", dot: "#A8A29E" },
  }

  const hasFilter = !!filterDay || !!filterMonth

  const metrics = [
    {
      label: hasFilter ? `Receita — ${periodLabel}` : "Receita do mes",
      value: fmt(receitaMes),
      sub: aReceber > 0 && !hasFilter ? `+ ${fmt(aReceber)} a receber` : `${active.filter((p) => (p.tipo === "normal" || !p.tipo) && p.status !== "cancelado").length} pedidos normais`,
      subColor: aReceber > 0 && !hasFilter ? "#92400E" : "#16A34A",
      border: "#EDE8EA",
    },
    {
      label: hasFilter ? `Pedidos — ${periodLabel}` : "Pedidos no mes",
      value: String(active.length),
      sub: `${active.filter((p) => p.status === "entregue" || p.status === "cf_pago").length} concluidos`,
      subColor: "#16A34A",
      border: "#EDE8EA",
    },
    {
      label: "Aguardando confirmacao",
      value: String(pendingOrders.length),
      sub: "Requerem atencao",
      subColor: "#92400E",
      border: "#FDE68A",
      bg: "#FFFBEB",
    },
    {
      label: "Estoque baixo",
      value: String(lowStock.length),
      sub: "Variacoes para repor",
      subColor: "#DC2626",
      border: "#FECACA",
      bg: "#FEF2F2",
    },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "inherit" }}>
      {/* Header + filter */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917" }}>{saudacao}, Margarida 👋</h1>
          <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 2, textTransform: "capitalize" }}>{dataFormatada}</p>
        </div>
        <DateFilterBar
          filterDay={filterDay}
          filterMonth={filterMonth}
          onDayChange={setFilterDay}
          onMonthChange={setFilterMonth}
          onClear={() => { setFilterDay(""); setFilterMonth("") }}
        />
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: m.bg ?? "#fff", border: `1px solid ${m.border}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontWeight: 800, fontSize: 24, lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#78716C", marginBottom: 6, lineHeight: 1.4 }}>{m.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: m.subColor }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Receita</div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}>{barSubLabel}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#F472B6" }}>
              {fmt(barData.reduce((s, d) => s + d.val, 0))}
            </div>
          </div>
          <BarChart data={barData} />
        </div>
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Pedidos por status</div>
          <div style={{ fontSize: 11, color: "#A8A29E", marginBottom: 16 }}>{periodLabel}</div>
          <StatusDonut data={donutData} />
        </div>
      </div>

      {/* Bottom cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Pending */}
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Aguardando confirmacao</span>
            {pendingOrders.length > 0 && (
              <span style={{ background: "#FEF9C3", color: "#92400E", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>
                {pendingOrders.length} pendente{pendingOrders.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div>
            {pendingOrders.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center", color: "#A8A29E" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Tudo em dia!</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Nenhum pedido pendente</div>
              </div>
            ) : pendingOrders.slice(0, 5).map((p) => {
              const summary = p.items.map((i) => `${i.nome.split(" ").slice(0, 2).join(" ")} (${i.tamanho})`).join(", ")
              const time = new Date(p.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              return (
                <div key={p.id} style={{ padding: "11px 18px", borderBottom: "1px solid #F5F0F2", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{p.cliente_nome}</span>
                      <span style={{ fontSize: 11, color: "#A8A29E" }}>· {time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#78716C", marginBottom: 6, lineHeight: 1.5 }}>{summary || "—"}</div>
                    <div style={{ fontWeight: 800, color: "#F472B6", fontSize: 13 }}>{fmt(p.total)}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => confirmOrder(p.id)} disabled={confirming === p.id}
                      style={{ background: "#16A34A", color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: confirming === p.id ? 0.6 : 1 }}>
                      {confirming === p.id ? "..." : "Confirmar"}
                    </button>
                    <Link href="/admin/pedidos" style={{ textAlign: "center", fontSize: 12, color: "#78716C", fontWeight: 600, textDecoration: "none" }}>Ver detalhes</Link>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ padding: "12px 18px", borderTop: "1px solid #EDE8EA" }}>
            <Link href="/admin/pedidos" style={{ fontSize: 13, color: "#F472B6", fontWeight: 700, textDecoration: "none" }}>Ver todos os pedidos →</Link>
          </div>
        </div>

        {/* Low stock */}
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Estoque baixo</span>
            {lowStock.length > 0 && (
              <span style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>
                {lowStock.length} {lowStock.length === 1 ? "variacao" : "variacoes"}
              </span>
            )}
          </div>
          <div>
            {lowStock.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center", color: "#A8A29E" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Tudo em ordem!</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Sem variacoes com estoque critico</div>
              </div>
            ) : lowStock.map((v, i) => (
              <div key={`${v.produto_id}-${v.tamanho}`} style={{ padding: "11px 18px", borderBottom: i < lowStock.length - 1 ? "1px solid #F5F0F2" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: "1px solid #EDE8EA" }}>👗</div>
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
            <span style={{ fontWeight: 700, fontSize: 14 }}>Pedidos recentes{hasFilter ? ` — ${periodLabel}` : ""}</span>
            <Link href="/admin/pedidos" style={{ fontSize: 12, color: "#F472B6", fontWeight: 700, textDecoration: "none" }}>Ver todos</Link>
          </div>
          <div>
            {recentOrders.map((o, i) => {
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
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#F472B6", flexShrink: 0 }}>{fmt(o.total)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ background: "linear-gradient(135deg,#FDF2F8 0%,#F5F0FF 100%)", border: "1px solid #EDE8EA", borderRadius: 10, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1C1917" }}>Pronto para cadastrar um novo produto?</div>
          <div style={{ fontSize: 12, color: "#78716C", marginTop: 4 }}>Adicione fotos, tamanhos e o produto ja aparece no catalogo.</div>
        </div>
        <Link href="/admin/produtos/novo" style={{ background: "#1C1917", color: "#fff", borderRadius: 6, padding: "9px 16px", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo produto
        </Link>
      </div>
    </div>
  )
}
