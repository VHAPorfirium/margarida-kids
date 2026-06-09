import { createClient } from "@/lib/supabase/server"
import type { VariacaoEstoque } from "@/lib/types"
import { DashboardClient } from "./dashboard-client"
import type { WeekDay, DonutSlice, LowStockItem, PedidoResumo } from "./dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { data: pedidos },
    { data: variacoes },
    { data: produtos },
  ] = await Promise.all([
    supabase.from("pedidos").select("id,cliente_nome,cliente_telefone,total,status,items,criado_em").order("criado_em", { ascending: false }),
    supabase.from("variacoes_estoque").select("produto_id,tamanho,quantidade_disponivel"),
    supabase.from("produtos").select("id,nome"),
  ])

  /* ── metrics ── */
  const pedidosMes = (pedidos ?? []).filter((p) => p.criado_em >= startOfMonth)
  const receitaMes = pedidosMes.filter((p) => p.status !== "cancelado").reduce((s, p) => s + (p.total ?? 0), 0)
  const pendingOrders: PedidoResumo[] = (pedidos ?? []).filter((p) => p.status === "aguardando") as PedidoResumo[]
  const recentOrders: PedidoResumo[] = (pedidos ?? []).slice(0, 5) as PedidoResumo[]

  // Low stock: variacoes with 1-3 units, joined with produto names
  const prodMap = Object.fromEntries((produtos ?? []).map((p) => [p.id, p.nome]))
  const lowStock: LowStockItem[] = (variacoes as VariacaoEstoque[] | null)
    ?.filter((v) => v.quantidade_disponivel > 0 && v.quantidade_disponivel <= 3)
    .slice(0, 6)
    .map((v) => ({ produto_id: v.produto_id, produto_nome: prodMap[v.produto_id] ?? null, tamanho: v.tamanho, quantidade_disponivel: v.quantidade_disponivel })) ?? []

  /* ── week bar chart: sum totals by day label for last 7 days ── */
  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const weekMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    weekMap[dayLabels[d.getDay()]] = 0
  }
  ;(pedidos ?? []).forEach((p) => {
    if (p.status === "cancelado") return
    const d = new Date(p.criado_em)
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays <= 6) {
      const label = dayLabels[d.getDay()]
      weekMap[label] = (weekMap[label] ?? 0) + (p.total ?? 0)
    }
  })
  const weekData: WeekDay[] = Object.entries(weekMap).map(([day, val]) => ({ day, val: Math.round(val) }))

  /* ── donut: pedidos by status this month ── */
  const STATUS_DONUT: { status: string; label: string; color: string }[] = [
    { status: "entregue",  label: "Entregues",   color: "#22C55E" },
    { status: "enviado",   label: "Enviados",    color: "#F97316" },
    { status: "separacao", label: "Separação",   color: "#A78BFA" },
    { status: "confirmado",label: "Confirmados", color: "#60A5FA" },
    { status: "aguardando",label: "Aguardando",  color: "#FCD34D" },
  ]
  const donutData: DonutSlice[] = STATUS_DONUT.map(({ status, label, color }) => ({
    label, color,
    val: pedidosMes.filter((p) => p.status === status).length,
  }))

  /* ── greeting ── */
  const saudacao = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite"
  const dataFormatada = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  const metrics = [
    { label: "Receita do mês",        value: receitaMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), sub: "Pedidos não cancelados", subColor: "#16A34A", border: "#EDE8EA" },
    { label: "Pedidos no mês",         value: String(pedidosMes.length), sub: `${pedidosMes.filter(p => p.status === "entregue").length} entregues`, subColor: "#16A34A", border: "#EDE8EA" },
    { label: "Aguardando confirmação", value: String(pendingOrders.length), sub: "Requerem atenção", subColor: "#92400E", border: "#FDE68A", bg: "#FFFBEB" },
    { label: "Estoque baixo",          value: String(lowStock.length), sub: "Variações para repor", subColor: "#DC2626", border: "#FECACA", bg: "#FEF2F2" },
  ]

  return (
    <DashboardClient
      pendingOrders={pendingOrders}
      recentOrders={recentOrders}
      weekData={weekData}
      donutData={donutData}
      lowStock={lowStock}
      metrics={metrics}
      saudacao={saudacao}
      dataFormatada={dataFormatada}
    />
  )
}
