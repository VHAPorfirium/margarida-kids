"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/* ════════════════════════════════════════════
   TYPES
════════════════════════════════════════════ */
interface ItemPedido { nome: string; tamanho: string; quantidade: number; preco: number; variacao_id?: string }
interface Pedido {
  id: string; cliente_nome: string; cliente_telefone: string
  items: ItemPedido[]; total: number; status: string; tipo: string
  nota?: string; codigo_rastreio?: string; criado_em: string; atualizado_em: string
}
interface Produto { id: string; nome: string; variacoes_estoque: { id: string; tamanho: string; quantidade_disponivel: number }[] }

const PAGE_SIZE = 20

/* ════════════════════════════════════════════
   PEDIDOS NORMAIS — constants
════════════════════════════════════════════ */
const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  aguardando:  { label: "Aguardando",  bg: "#FEF9C3", color: "#92400E", dot: "#FBBF24" },
  confirmado:  { label: "Confirmado",  bg: "#EFF6FF", color: "#1D4ED8", dot: "#60A5FA" },
  separacao:   { label: "Separacao",   bg: "#F3E8FF", color: "#6D28D9", dot: "#A78BFA" },
  enviado:     { label: "Enviado",     bg: "#FFF7ED", color: "#C2410C", dot: "#F97316" },
  entregue:    { label: "Entregue",    bg: "#F0FDF4", color: "#15803D", dot: "#4ADE80" },
  cancelado:   { label: "Cancelado",   bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
}
const FLOW = ["aguardando", "confirmado", "separacao", "enviado", "entregue"]
const FLOW_LABELS: Record<string, string> = { aguardando: "Aguardando", confirmado: "Confirmado", separacao: "Separacao", enviado: "Enviado", entregue: "Entregue" }
const NEXT_ACTION: Record<string, { label: string; color: string; needsTracking?: boolean }> = {
  aguardando:  { label: "Confirmar pedido",    color: "#1C1917" },
  confirmado:  { label: "Iniciar separacao",   color: "#6D28D9" },
  separacao:   { label: "Marcar como enviado", color: "#F97316", needsTracking: true },
  enviado:     { label: "Confirmar entrega",   color: "#16A34A" },
}

/* ════════════════════════════════════════════
   CONFIANCA — constants
════════════════════════════════════════════ */
const CF_STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  cf_separado:   { label: "Separado",      bg: "#F3E8FF", color: "#6D28D9", dot: "#A78BFA" },
  cf_entregue:   { label: "Entregue",      bg: "#FFF7ED", color: "#C2410C", dot: "#F97316" },
  cf_aguardando: { label: "Aguard. pag.",  bg: "#FEF9C3", color: "#92400E", dot: "#FBBF24" },
  cf_pago:       { label: "Pago",          bg: "#F0FDF4", color: "#15803D", dot: "#4ADE80" },
  cf_devolvido:  { label: "Devolvido",     bg: "#F5F5F4", color: "#78716C", dot: "#A8A29E" },
}
const CF_FLOW = ["cf_separado", "cf_entregue", "cf_aguardando", "cf_pago"]
const CF_FLOW_LABELS: Record<string, string> = {
  cf_separado: "Separado", cf_entregue: "Entregue", cf_aguardando: "Aguard.", cf_pago: "Pago",
}

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) }

function applyDateFilter(list: Pedido[], filterDay: string, filterMonth: string): Pedido[] {
  if (filterDay) {
    return list.filter((p) => {
      const d = new Date(p.criado_em)
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      return local === filterDay
    })
  }
  if (filterMonth) {
    return list.filter((p) => {
      const d = new Date(p.criado_em)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      return ym === filterMonth
    })
  }
  return list
}

function StatusPill({ status, meta }: { status: string; meta: Record<string, { label: string; bg: string; color: string; dot: string }> }) {
  const m = meta[status]
  if (!m) return null
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: m.bg, color: m.color, borderRadius: 4, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, display: "inline-block" }} />
      {m.label}
    </span>
  )
}

function Timeline({ flow, labels, currentIdx }: { flow: string[]; labels: Record<string, string>; currentIdx: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      {flow.map((s, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < flow.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "#F472B6" : "#EDE8EA", display: "flex", alignItems: "center", justifyContent: "center", border: active ? "3px solid #F9A8D4" : "none", flexShrink: 0 }}>
                {done && !active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: done ? "#F472B6" : "#A8A29E", whiteSpace: "nowrap" }}>{labels[s]}</div>
            </div>
            {i < flow.length - 1 && <div style={{ flex: 1, height: 2, background: i < currentIdx ? "#F472B6" : "#EDE8EA", marginBottom: 16, marginLeft: 2, marginRight: 2 }} />}
          </div>
        )
      })}
    </div>
  )
}

function ItemsList({ items, total }: { items: ItemPedido[]; total: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>Itens</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #F5F0F2", fontSize: 13 }}>
          <div>
            <span style={{ fontWeight: 700 }}>{it.nome}</span>
            <span style={{ color: "#A8A29E", marginLeft: 6 }}>Tam. {it.tamanho} x {it.quantidade}</span>
            {it.variacao_id && <span style={{ marginLeft: 6, fontSize: 10, background: "#F0FDF4", color: "#16A34A", borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>vinculado</span>}
          </div>
          <span style={{ fontWeight: 700 }}>{fmt(it.preco * it.quantidade)}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 800, fontSize: 15 }}>
        <span>Total</span><span style={{ color: "#F472B6" }}>{fmt(total)}</span>
      </div>
    </div>
  )
}

function ClienteCard({ nome, telefone }: { nome: string; telefone: string }) {
  return (
    <div style={{ background: "#FAFAF9", border: "1px solid #EDE8EA", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>Cliente</div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{nome}</div>
      <a href={"https://wa.me/55" + telefone.replace(/\D/g, "")} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#16A34A", fontWeight: 600, textDecoration: "none" }}>
        Contato no WhatsApp
      </a>
    </div>
  )
}

/* ════════════════════════════════════════════
   DATE FILTER BAR
════════════════════════════════════════════ */
function DateFilterBar({ filterDay, filterMonth, onDayChange, onMonthChange, onClear, total, filtered }:
  { filterDay: string; filterMonth: string; onDayChange: (v: string) => void; onMonthChange: (v: string) => void; onClear: () => void; total: number; filtered: number }) {
  const hasFilter = !!filterDay || !!filterMonth
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #EDE8EA", flexWrap: "wrap", background: "#FAFAF9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#78716C" }}>Filtrar:</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600 }}>Dia</label>
        <input type="date" value={filterDay} onChange={(e) => { onDayChange(e.target.value); if (e.target.value) onMonthChange("") }}
          style={{ padding: "5px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", background: filterDay ? "#FDF2F8" : "#fff", color: filterDay ? "#F472B6" : "#1C1917", fontWeight: filterDay ? 700 : 400 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600 }}>Mes</label>
        <input type="month" value={filterMonth} onChange={(e) => { onMonthChange(e.target.value); if (e.target.value) onDayChange("") }}
          style={{ padding: "5px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", background: filterMonth ? "#FDF2F8" : "#fff", color: filterMonth ? "#F472B6" : "#1C1917", fontWeight: filterMonth ? 700 : 400 }} />
      </div>
      {hasFilter && (
        <button onClick={onClear}
          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Limpar filtro
        </button>
      )}
      <div style={{ marginLeft: "auto", fontSize: 11, color: "#A8A29E", fontWeight: 600 }}>
        {hasFilter ? `${filtered} de ${total}` : `${total} pedido(s)`}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   PAGINATION
════════════════════════════════════════════ */
function Pagination({ page, total, pageSize, onChange }:
  { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #EDE8EA", background: "#FAFAF9" }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 14px", borderRadius: 6, border: "1px solid #EDE8EA", background: page === 1 ? "#F5F5F4" : "#fff", color: page === 1 ? "#A8A29E" : "#1C1917", fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: page === 1 ? "not-allowed" : "pointer" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Anterior
      </button>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p: number
          if (totalPages <= 7) p = i + 1
          else if (page <= 4) p = i + 1
          else if (page >= totalPages - 3) p = totalPages - 6 + i
          else p = page - 3 + i
          if (p < 1 || p > totalPages) return null
          return (
            <button key={p} onClick={() => onChange(p)}
              style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid " + (page === p ? "#F472B6" : "#EDE8EA"), background: page === p ? "#FDF2F8" : "#fff", color: page === p ? "#F472B6" : "#78716C", fontFamily: "inherit", fontWeight: page === p ? 800 : 600, fontSize: 12, cursor: "pointer" }}>
              {p}
            </button>
          )
        })}
      </div>
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 14px", borderRadius: 6, border: "1px solid #EDE8EA", background: page === totalPages ? "#F5F5F4" : "#fff", color: page === totalPages ? "#A8A29E" : "#1C1917", fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: page === totalPages ? "not-allowed" : "pointer" }}>
        Proximo
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════
   ORDER DRAWER (normal)
════════════════════════════════════════════ */
function OrderDrawer({ order, onClose, onUpdate }: { order: Pedido; onClose: () => void; onUpdate: (o: Pedido) => void }) {
  const [trackingCode, setTrackingCode] = useState(order.codigo_rastreio ?? "")
  const [advancing, setAdvancing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [converting, setConverting] = useState(false)
  const currentIdx = FLOW.indexOf(order.status)
  const next = NEXT_ACTION[order.status]

  async function advance() {
    if (!next) return
    if (next.needsTracking && !trackingCode.trim()) { alert("Informe o codigo de rastreio"); return }
    setAdvancing(true)
    const nextStatus = FLOW[currentIdx + 1]
    const supabase = createClient()
    const { data } = await supabase.from("pedidos").update({ status: nextStatus, codigo_rastreio: trackingCode || null }).eq("id", order.id).select().single()
    if (data) onUpdate(data as Pedido)
    setAdvancing(false)
  }

  async function cancel() {
    if (!confirm("Cancelar este pedido?")) return
    setCancelling(true)
    const supabase = createClient()
    const { data } = await supabase.from("pedidos").update({ status: "cancelado" }).eq("id", order.id).select().single()
    if (data) onUpdate(data as Pedido)
    setCancelling(false)
    onClose()
  }

  async function convertToConfianca() {
    if (!confirm("Converter para venda em confianca? O pedido entrara no fluxo de confianca (Separado).")) return
    setConverting(true)
    const supabase = createClient()
    const { data } = await supabase.from("pedidos").update({ tipo: "confianca", status: "cf_separado" }).eq("id", order.id).select().single()
    if (data) onUpdate(data as Pedido)
    setConverting(false)
    onClose()
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "min(420px,100vw)", background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,.08)", display: "flex", flexDirection: "column", animation: "slideIn .2s ease", fontFamily: "inherit" }}>
        <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{order.cliente_nome}</div>
            <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 1 }}>{fmtDate(order.criado_em)}</div>
          </div>
          <StatusPill status={order.status} meta={STATUS_META} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <Timeline flow={FLOW} labels={FLOW_LABELS} currentIdx={currentIdx} />
          <ClienteCard nome={order.cliente_nome} telefone={order.cliente_telefone} />
          <ItemsList items={order.items} total={order.total} />
          {(order.status === "separacao" || order.status === "enviado") && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 6 }}>Codigo de rastreio</label>
              <input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="BR123456789"
                style={{ display: "block", width: "100%", padding: "9px 12px", border: "1px solid #EDE8EA", borderRadius: 7, fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
          {order.nota && (
            <div style={{ padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 12, color: "#92400E" }}>
              <span style={{ fontWeight: 700 }}>Nota: </span>{order.nota}
            </div>
          )}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #EDE8EA", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {next && order.status !== "cancelado" && (
            <button onClick={advance} disabled={advancing}
              style={{ display: "block", width: "100%", padding: 13, borderRadius: 8, border: "none", background: advancing ? "#E5E0DC" : next.color, color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: advancing ? "not-allowed" : "pointer" }}>
              {advancing ? "Atualizando..." : next.label}
            </button>
          )}
          {order.status === "aguardando" && (
            <button onClick={convertToConfianca} disabled={converting}
              style={{ display: "block", width: "100%", padding: 12, borderRadius: 8, border: "1px solid #DDD6FE", background: "#F3E8FF", color: "#6D28D9", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: converting ? "not-allowed" : "pointer" }}>
              {converting ? "Convertendo..." : "Converter para confianca"}
            </button>
          )}
          {order.status !== "cancelado" && order.status !== "entregue" && (
            <button onClick={cancel} disabled={cancelling}
              style={{ display: "block", width: "100%", padding: 12, borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              {cancelling ? "Cancelando..." : "Cancelar pedido"}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/* ════════════════════════════════════════════
   CONFIANCA DRAWER
════════════════════════════════════════════ */
function ConfiancaDrawer({ order, onClose, onUpdate }: { order: Pedido; onClose: () => void; onUpdate: (o: Pedido) => void }) {
  const [advancing, setAdvancing] = useState(false)
  const [returning, setReturning] = useState(false)
  const currentIdx = CF_FLOW.indexOf(order.status)

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])

  async function advance() {
    if (currentIdx >= CF_FLOW.length - 1) return
    const nextStatus = CF_FLOW[currentIdx + 1]
    const willDeductStock = nextStatus === "cf_entregue"
    if (willDeductStock && !confirm("Isso ira baixar o estoque automaticamente para itens vinculados. Confirmar?")) return
    setAdvancing(true)
    const supabase = createClient()
    if (willDeductStock) {
      for (const item of order.items) {
        if (!item.variacao_id) continue
        const { data: v } = await supabase.from("variacoes_estoque").select("quantidade_disponivel").eq("id", item.variacao_id).single()
        if (v) await supabase.from("variacoes_estoque").update({ quantidade_disponivel: Math.max(0, v.quantidade_disponivel - item.quantidade) }).eq("id", item.variacao_id)
      }
    }
    const { data } = await supabase.from("pedidos").update({ status: nextStatus }).eq("id", order.id).select().single()
    if (data) onUpdate(data as Pedido)
    setAdvancing(false)
  }

  async function markDevolvido() {
    if (!confirm("Marcar como devolvido? Os itens vinculados retornarao ao estoque.")) return
    setReturning(true)
    const supabase = createClient()
    if (order.status === "cf_entregue" || order.status === "cf_aguardando") {
      for (const item of order.items) {
        if (!item.variacao_id) continue
        const { data: v } = await supabase.from("variacoes_estoque").select("quantidade_disponivel").eq("id", item.variacao_id).single()
        if (v) await supabase.from("variacoes_estoque").update({ quantidade_disponivel: v.quantidade_disponivel + item.quantidade }).eq("id", item.variacao_id)
      }
    }
    const { data } = await supabase.from("pedidos").update({ status: "cf_devolvido" }).eq("id", order.id).select().single()
    if (data) onUpdate(data as Pedido)
    setReturning(false)
    onClose()
  }

  const advanceLabels: Record<string, string> = {
    cf_separado:   "Registrar entrega ao cliente",
    cf_entregue:   "Marcar como aguardando pagamento",
    cf_aguardando: "Confirmar pagamento recebido",
  }
  const advanceBg: Record<string, string> = {
    cf_separado: "#6D28D9", cf_entregue: "#C2410C", cf_aguardando: "#16A34A",
  }
  const statusInfo: Record<string, { bg: string; border: string; color: string; text: string }> = {
    cf_separado:   { bg: "#F3E8FF", border: "#DDD6FE", color: "#6D28D9", text: "Itens separados e prontos para entrega." },
    cf_entregue:   { bg: "#FFF7ED", border: "#FED7AA", color: "#C2410C", text: "Itens entregues. Estoque baixado. Aguardando decisao do cliente." },
    cf_aguardando: { bg: "#FEF9C3", border: "#FDE68A", color: "#92400E", text: "Cliente ficou com as pecas. Aguardando pagamento de " + fmt(order.total) + "." },
    cf_pago:       { bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D", text: "Pagamento confirmado! Esta venda ja aparece nas estatisticas." },
    cf_devolvido:  { bg: "#F5F5F4", border: "#EDE8EA", color: "#78716C", text: "Pecas devolvidas. Estoque restaurado." },
  }
  const info = statusInfo[order.status]

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "min(420px,100vw)", background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,.08)", display: "flex", flexDirection: "column", animation: "slideIn .2s ease", fontFamily: "inherit" }}>
        <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{order.cliente_nome}</div>
            <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 1 }}>Confianca - {fmtDate(order.criado_em)}</div>
          </div>
          <StatusPill status={order.status} meta={CF_STATUS_META} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <Timeline flow={CF_FLOW} labels={CF_FLOW_LABELS} currentIdx={currentIdx} />
          {info && (
            <div style={{ padding: "12px 14px", background: info.bg, border: "1px solid " + info.border, borderRadius: 8, marginBottom: 14, fontSize: 12, color: info.color, fontWeight: 600 }}>
              {info.text}
            </div>
          )}
          <ClienteCard nome={order.cliente_nome} telefone={order.cliente_telefone} />
          <ItemsList items={order.items} total={order.total} />
          {order.nota && (
            <div style={{ padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 12, color: "#92400E" }}>
              <span style={{ fontWeight: 700 }}>Nota: </span>{order.nota}
            </div>
          )}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #EDE8EA", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {order.status !== "cf_pago" && order.status !== "cf_devolvido" && (
            <>
              {currentIdx < CF_FLOW.length - 1 && (
                <button onClick={advance} disabled={advancing}
                  style={{ display: "block", width: "100%", padding: 13, borderRadius: 8, border: "none", background: advancing ? "#E5E0DC" : (advanceBg[order.status] ?? "#1C1917"), color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: advancing ? "not-allowed" : "pointer" }}>
                  {advancing ? "Atualizando..." : advanceLabels[order.status]}
                </button>
              )}
              {(order.status === "cf_entregue" || order.status === "cf_aguardando") && (
                <button onClick={markDevolvido} disabled={returning}
                  style={{ display: "block", width: "100%", padding: 12, borderRadius: 8, border: "1px solid #EDE8EA", background: "#FAFAF9", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  {returning ? "Processando..." : "Marcar como devolvido"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

/* ════════════════════════════════════════════
   NEW ORDER MODAL (normal)
════════════════════════════════════════════ */
function NewOrderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (o: Pedido) => void }) {
  const [nome, setNome] = useState(""); const [tel, setTel] = useState(""); const [nota, setNota] = useState("")
  const [items, setItems] = useState([{ nome: "", tamanho: "", quantidade: 1, preco: 0 }])
  const [saving, setSaving] = useState(false)
  const total = items.reduce((s, it) => s + it.preco * it.quantidade, 0)

  async function save() {
    if (!nome.trim() || !tel.trim()) { alert("Nome e telefone sao obrigatorios"); return }
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from("pedidos").insert({ cliente_nome: nome, cliente_telefone: tel, items, total, nota: nota || null, status: "aguardando", tipo: "normal" }).select().single()
    if (data) onCreate(data as Pedido)
    setSaving(false); onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300 }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 301, background: "#fff", borderRadius: "16px 16px 0 0", padding: 24, maxHeight: "85vh", overflowY: "auto", fontFamily: "inherit", animation: "slideUp .2s ease" }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Novo pedido</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 5 }}>Nome</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid #EDE8EA", borderRadius: 7, fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 5 }}>Telefone</label>
              <input value={tel} onChange={(e) => setTel(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid #EDE8EA", borderRadius: 7, fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#78716C" }}>Itens</label>
              <button onClick={() => setItems((p) => [...p, { nome: "", tamanho: "", quantidade: 1, preco: 0 }])} style={{ fontSize: 12, fontWeight: 700, color: "#F472B6", background: "none", border: "none", cursor: "pointer" }}>+ Adicionar</button>
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 60px 80px 28px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                <input placeholder="Nome" value={it.nome} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} style={{ padding: "8px 10px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                <input placeholder="Tam." value={it.tamanho} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, tamanho: e.target.value } : x))} style={{ padding: "8px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                <input type="number" min={1} value={it.quantidade} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, quantidade: parseInt(e.target.value) || 1 } : x))} style={{ padding: "8px 6px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none", textAlign: "center" }} />
                <input type="number" min={0} step={0.01} placeholder="R$" value={it.preco || ""} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, preco: parseFloat(e.target.value) || 0 } : x))} style={{ padding: "8px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#A8A29E", fontSize: 18, padding: 0 }}>x</button>
              </div>
            ))}
          </div>
          <div><label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 5 }}>Nota</label>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} style={{ width: "100%", padding: "9px 12px", border: "1px solid #EDE8EA", borderRadius: 7, fontFamily: "inherit", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Total: {fmt(total)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 7, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 18px", borderRadius: 7, border: "none", background: saving ? "#E5E0DC" : "#1C1917", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Salvando..." : "Criar pedido"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ════════════════════════════════════════════
   NEW CONFIANCA MODAL
════════════════════════════════════════════ */
function NewConfiancaModal({ onClose, onCreate }: { onClose: () => void; onCreate: (o: Pedido) => void }) {
  const [nome, setNome] = useState(""); const [tel, setTel] = useState(""); const [nota, setNota] = useState("")
  const [items, setItems] = useState<{ nome: string; tamanho: string; quantidade: number; preco: number; variacao_id?: string }[]>([{ nome: "", tamanho: "", quantidade: 1, preco: 0 }])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [saving, setSaving] = useState(false)
  const total = items.reduce((s, it) => s + it.preco * it.quantidade, 0)

  useEffect(() => {
    createClient().from("produtos").select("id,nome,variacoes_estoque(id,tamanho,quantidade_disponivel)").eq("status", "disponivel").then(({ data }) => setProdutos((data ?? []) as Produto[]))
  }, [])

  function selectVariacao(idx: number, produtoId: string, variacaoId: string) {
    const p = produtos.find((x) => x.id === produtoId)
    const v = p?.variacoes_estoque.find((x) => x.id === variacaoId)
    if (!p || !v) return
    setItems((prev) => prev.map((x, i) => i === idx ? { ...x, nome: p.nome, tamanho: v.tamanho, variacao_id: v.id } : x))
  }

  async function save() {
    if (!nome.trim() || !tel.trim()) { alert("Nome e telefone sao obrigatorios"); return }
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from("pedidos").insert({ cliente_nome: nome, cliente_telefone: tel, items, total, nota: nota || null, status: "cf_separado", tipo: "confianca" }).select().single()
    if (data) onCreate(data as Pedido)
    setSaving(false); onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300 }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 301, background: "#fff", borderRadius: "16px 16px 0 0", padding: 24, maxHeight: "90vh", overflowY: "auto", fontFamily: "inherit", animation: "slideUp .2s ease" }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Nova venda em confianca</div>
        <div style={{ fontSize: 12, color: "#6D28D9", marginBottom: 20, padding: "10px 12px", background: "#F3E8FF", borderRadius: 7, border: "1px solid #DDD6FE", fontWeight: 600 }}>
          Estoque e baixado na entrega. Receita conta somente ao confirmar pagamento.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 5 }}>Nome</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid #EDE8EA", borderRadius: 7, fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 5 }}>Telefone</label>
              <input value={tel} onChange={(e) => setTel(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid #EDE8EA", borderRadius: 7, fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#78716C" }}>Itens</label>
              <button onClick={() => setItems((p) => [...p, { nome: "", tamanho: "", quantidade: 1, preco: 0 }])} style={{ fontSize: 12, fontWeight: 700, color: "#6D28D9", background: "none", border: "none", cursor: "pointer" }}>+ Adicionar</button>
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ background: "#FAFAF9", border: "1px solid #EDE8EA", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
                  <select onChange={(e) => { const [pId, vId] = e.target.value.split("|"); if (pId && vId) selectVariacao(i, pId, vId) }} defaultValue=""
                    style={{ flex: 1, padding: "8px 10px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, background: "#fff", outline: "none" }}>
                    <option value="" disabled>Selecionar do catalogo (opcional)</option>
                    {produtos.map((p) => p.variacoes_estoque.map((v) => (
                      <option key={v.id} value={p.id + "|" + v.id}>{p.nome} - Tam. {v.tamanho} ({v.quantidade_disponivel} em estoque)</option>
                    )))}
                  </select>
                  <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#A8A29E", fontSize: 18, padding: 0, flexShrink: 0 }}>x</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 60px 90px", gap: 6 }}>
                  <input placeholder="Nome da peca" value={it.nome} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} style={{ padding: "8px 10px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                  <input placeholder="Tamanho" value={it.tamanho} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, tamanho: e.target.value } : x))} style={{ padding: "8px 10px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                  <input type="number" min={1} value={it.quantidade} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, quantidade: parseInt(e.target.value) || 1 } : x))} style={{ padding: "8px 6px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none", textAlign: "center" }} />
                  <input type="number" min={0} step={0.01} placeholder="R$" value={it.preco || ""} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, preco: parseFloat(e.target.value) || 0 } : x))} style={{ padding: "8px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                </div>
                {it.variacao_id && <div style={{ marginTop: 6, fontSize: 11, color: "#16A34A", fontWeight: 600 }}>Estoque vinculado - sera baixado automaticamente na entrega</div>}
              </div>
            ))}
          </div>
          <div><label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 5 }}>Nota</label>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} style={{ width: "100%", padding: "9px 12px", border: "1px solid #EDE8EA", borderRadius: 7, fontFamily: "inherit", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Total: {fmt(total)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 7, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 18px", borderRadius: 7, border: "none", background: saving ? "#E5E0DC" : "#6D28D9", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Salvando..." : "Registrar confianca"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
const NORMAL_TABS = [
  { id: "todos", label: "Todos" },
  { id: "aguardando", label: "Aguardando" },
  { id: "confirmado", label: "Confirmado" },
  { id: "separacao", label: "Separacao" },
  { id: "enviado", label: "Enviado" },
  { id: "entregue", label: "Entregue" },
]
const CF_TABS = [
  { id: "todos", label: "Todos" },
  { id: "cf_separado", label: "Separado" },
  { id: "cf_entregue", label: "Entregue" },
  { id: "cf_aguardando", label: "Aguard. pag." },
  { id: "cf_pago", label: "Pago" },
  { id: "cf_devolvido", label: "Devolvido" },
]

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [mainTab, setMainTab] = useState<"normal" | "confianca">("normal")
  const [normalFilter, setNormalFilter] = useState("todos")
  const [cfFilter, setCfFilter] = useState("todos")
  const [selected, setSelected] = useState<Pedido | null>(null)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showNewConfianca, setShowNewConfianca] = useState(false)

  // Date filters — independent per tab
  const [normalDay, setNormalDay] = useState("")
  const [normalMonth, setNormalMonth] = useState("")
  const [cfDay, setCfDay] = useState("")
  const [cfMonth, setCfMonth] = useState("")

  // Pagination — independent per tab
  const [normalPage, setNormalPage] = useState(1)
  const [cfPage, setCfPage] = useState(1)

  useEffect(() => {
    createClient().from("pedidos").select("*").order("criado_em", { ascending: false }).then(({ data }) => {
      setPedidos((data ?? []) as Pedido[])
      setLoading(false)
    })
  }, [])

  function updateOrder(o: Pedido) {
    setPedidos((prev) => prev.map((p) => p.id === o.id ? o : p))
    setSelected(o)
    if (o.tipo === "confianca") setMainTab("confianca")
  }

  // Reset page when status filter or date filter changes
  function handleNormalFilter(v: string) { setNormalFilter(v); setNormalPage(1) }
  function handleCfFilter(v: string) { setCfFilter(v); setCfPage(1) }
  function handleNormalDay(v: string) { setNormalDay(v); setNormalPage(1) }
  function handleNormalMonth(v: string) { setNormalMonth(v); setNormalPage(1) }
  function handleCfDay(v: string) { setCfDay(v); setCfPage(1) }
  function handleCfMonth(v: string) { setCfMonth(v); setCfPage(1) }

  const normalOrders = pedidos.filter((p) => p.tipo === "normal" || !p.tipo)
  const cfOrders = pedidos.filter((p) => p.tipo === "confianca")

  // Status filter
  const statusFilteredNormal = normalFilter === "todos" ? normalOrders : normalOrders.filter((p) => p.status === normalFilter)
  const statusFilteredCf = cfFilter === "todos" ? cfOrders : cfOrders.filter((p) => p.status === cfFilter)

  // Date filter
  const dateFilteredNormal = applyDateFilter(statusFilteredNormal, normalDay, normalMonth)
  const dateFilteredCf = applyDateFilter(statusFilteredCf, cfDay, cfMonth)

  // Pagination
  const normalTotalPages = Math.ceil(dateFilteredNormal.length / PAGE_SIZE)
  const cfTotalPages = Math.ceil(dateFilteredCf.length / PAGE_SIZE)
  const pagedNormal = dateFilteredNormal.slice((normalPage - 1) * PAGE_SIZE, normalPage * PAGE_SIZE)
  const pagedCf = dateFilteredCf.slice((cfPage - 1) * PAGE_SIZE, cfPage * PAGE_SIZE)

  const displayList = mainTab === "normal" ? pagedNormal : pagedCf
  const currentMeta = mainTab === "normal" ? STATUS_META : CF_STATUS_META
  const currentFiltered = mainTab === "normal" ? dateFilteredNormal.length : dateFilteredCf.length
  const currentTotal = mainTab === "normal" ? statusFilteredNormal.length : statusFilteredCf.length
  const currentPage = mainTab === "normal" ? normalPage : cfPage
  const currentSetPage = mainTab === "normal" ? setNormalPage : setCfPage

  function normalCount(id: string) { return id === "todos" ? normalOrders.length : normalOrders.filter((p) => p.status === id).length }
  function cfCount(id: string) { return id === "todos" ? cfOrders.length : cfOrders.filter((p) => p.status === id).length }

  const aReceber = cfOrders.filter((p) => p.status === "cf_entregue" || p.status === "cf_aguardando").reduce((s, p) => s + p.total, 0)

  // Date filter state for current tab
  const currentDay = mainTab === "normal" ? normalDay : cfDay
  const currentMonth = mainTab === "normal" ? normalMonth : cfMonth
  const currentHandleDay = mainTab === "normal" ? handleNormalDay : handleCfDay
  const currentHandleMonth = mainTab === "normal" ? handleNormalMonth : handleCfMonth
  const currentClearDate = mainTab === "normal"
    ? () => { setNormalDay(""); setNormalMonth(""); setNormalPage(1) }
    : () => { setCfDay(""); setCfMonth(""); setCfPage(1) }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917" }}>Pedidos</h1>
          <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 2 }}>Gerencie pedidos e vendas em confianca</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowNewConfianca(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F3E8FF", color: "#6D28D9", border: "1px solid #DDD6FE", borderRadius: 6, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Nova confianca
          </button>
          <button onClick={() => setShowNewOrder(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1C1917", color: "#fff", borderRadius: 6, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", fontFamily: "inherit" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo pedido
          </button>
        </div>
      </div>

      {aReceber > 0 && (
        <div style={{ background: "#FEF9C3", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#92400E" }}>A receber em confianca: {fmt(aReceber)}</span>
            <span style={{ fontSize: 12, color: "#A8A29E", marginLeft: 8 }}>{cfOrders.filter((p) => p.status === "cf_entregue" || p.status === "cf_aguardando").length} venda(s) em aberto</span>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
        {/* Main tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #EDE8EA" }}>
          {[{ id: "normal" as const, label: "Pedidos normais", count: normalOrders.length }, { id: "confianca" as const, label: "Confianca", count: cfOrders.length }].map((t) => (
            <button key={t.id} onClick={() => setMainTab(t.id)}
              style={{ flex: 1, padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: mainTab === t.id ? 800 : 600, fontSize: 14, color: mainTab === t.id ? "#F472B6" : "#78716C", borderBottom: "2px solid " + (mainTab === t.id ? "#F472B6" : "transparent") }}>
              {t.label}
              <span style={{ marginLeft: 7, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 800, background: mainTab === t.id ? "#FDF2F8" : "#F5F5F4", color: mainTab === t.id ? "#F472B6" : "#A8A29E" }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #EDE8EA" }}>
          {(mainTab === "normal" ? NORMAL_TABS : CF_TABS).map((t) => {
            const count = mainTab === "normal" ? normalCount(t.id) : cfCount(t.id)
            const active = mainTab === "normal" ? normalFilter === t.id : cfFilter === t.id
            return (
              <button key={t.id} onClick={() => mainTab === "normal" ? handleNormalFilter(t.id) : handleCfFilter(t.id)}
                style={{ padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 700 : 600, fontSize: 12, color: active ? "#F472B6" : "#78716C", borderBottom: "2px solid " + (active ? "#F472B6" : "transparent"), whiteSpace: "nowrap", flexShrink: 0 }}>
                {t.label}
                {count > 0 && <span style={{ marginLeft: 5, padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 800, background: active ? "#FDF2F8" : "#F5F5F4", color: active ? "#F472B6" : "#A8A29E" }}>{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Date filter bar */}
        <DateFilterBar
          filterDay={currentDay}
          filterMonth={currentMonth}
          onDayChange={currentHandleDay}
          onMonthChange={currentHandleMonth}
          onClear={currentClearDate}
          total={currentTotal}
          filtered={currentFiltered}
        />

        {/* List */}
        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#A8A29E", fontWeight: 600 }}>Carregando...</div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#A8A29E" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Nenhum pedido encontrado</div>
            {(currentDay || currentMonth) && <div style={{ fontSize: 12, marginTop: 4 }}>Tente limpar o filtro de data</div>}
          </div>
        ) : (
          <div>
            {displayList.map((pedido, i) => (
              <div key={pedido.id} onClick={() => setSelected(pedido)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < displayList.length - 1 ? "1px solid #F5F0F2" : "none", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAF9" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{pedido.cliente_nome}</div>
                  <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>{pedido.items.length} item(s) - {fmtDate(pedido.criado_em)}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{fmt(pedido.total)}</div>
                  <div style={{ marginTop: 4 }}><StatusPill status={pedido.status} meta={currentMeta} /></div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={currentPage}
          total={currentFiltered}
          pageSize={PAGE_SIZE}
          onChange={currentSetPage}
        />
      </div>

      {selected && selected.tipo === "confianca" && (
        <ConfiancaDrawer order={selected} onClose={() => setSelected(null)} onUpdate={updateOrder} />
      )}
      {selected && selected.tipo !== "confianca" && (
        <OrderDrawer order={selected} onClose={() => setSelected(null)} onUpdate={updateOrder} />
      )}
      {showNewOrder && <NewOrderModal onClose={() => setShowNewOrder(false)} onCreate={(o) => setPedidos((p) => [o, ...p])} />}
      {showNewConfianca && <NewConfiancaModal onClose={() => setShowNewConfianca(false)} onCreate={(o) => { setPedidos((p) => [o, ...p]); setMainTab("confianca") }} />}
    </div>
  )
}
