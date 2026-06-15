"use client"

import Link from "next/link"
import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"

/* ════════════════════════════════════════════
   TYPES
════════════════════════════════════════════ */
interface ItemPedido { nome: string; tamanho: string; quantidade?: number; qty?: number; preco: number; variacao_id?: string; foto?: string }
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
  separacao:   { label: "Separação",   bg: "#F3E8FF", color: "#6D28D9", dot: "#A78BFA" },
  entregue:    { label: "Entregue",    bg: "#F0FDF4", color: "#15803D", dot: "#4ADE80" },
  cancelado:   { label: "Cancelado",   bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
}
const FLOW = ["aguardando", "confirmado", "separacao", "entregue"]
const FLOW_LABELS: Record<string, string> = { aguardando: "Aguardando", confirmado: "Confirmado", separacao: "Separação", entregue: "Entregue" }
const NEXT_ACTION: Record<string, { label: string; color: string; needsTracking?: boolean }> = {
  aguardando:  { label: "Confirmar pedido",    color: "#1C1917" },
  confirmado:  { label: "Iniciar separação",   color: "#6D28D9" },
  separacao:   { label: "Confirmar entrega",   color: "#16A34A" },
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

/* ════════════════════════════════════════════
   HOOK: enrich items with fotos from DB
════════════════════════════════════════════ */
function useItemFotos(items: ItemPedido[]) {
  const [fotos, setFotos] = useState<Record<string, string>>({})
  useEffect(() => {
    const needsFoto = items.filter((it) => !it.foto && it.nome)
    if (needsFoto.length === 0) return
    const nomes = [...new Set(needsFoto.map((it) => it.nome))]
    fetch("/api/admin/produtos")
      .then((r) => r.json())
      .then((data: { nome: string; fotos: string[] }[]) => {
        if (!data) return
        const filtered = data.filter((p) => nomes.includes(p.nome))
        const map: Record<string, string> = {}
        for (const p of filtered) {
          if (p.fotos?.[0]) map[p.nome] = p.fotos[0]
        }
        setFotos(map)
      })
  }, [items])
  return fotos
}

function ItemsList({ items, total }: { items: ItemPedido[]; total: number }) {
  const dbFotos = useItemFotos(items)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>Itens</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F5F0F2" }}>
          {/* Thumbnail */}
          <div style={{ width: 52, height: 52, borderRadius: 8, background: "#FDF2F8", flexShrink: 0, overflow: "hidden", border: "1px solid #EDE8EA" }}>
            {(it.foto || dbFotos[it.nome])
              ? <img src={it.foto || dbFotos[it.nome]} alt={it.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👗</div>
            }
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1C1917", lineHeight: 1.3 }}>{it.nome}</div>
            <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>
              Tam. {it.tamanho} · x{it.quantidade ?? it.qty ?? 1}
              {it.variacao_id && <span style={{ marginLeft: 6, fontSize: 10, background: "#F0FDF4", color: "#16A34A", borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>vinculado</span>}
            </div>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{fmt(it.preco * (it.quantidade ?? it.qty ?? 1))}</span>
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
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const now = new Date()
  const currentYear = now.getFullYear()
  // value format: "YYYY-MM" or ""
  const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : -1

  function toggle(idx: number) {
    const monthStr = String(idx + 1).padStart(2, "0")
    const newVal = `${currentYear}-${monthStr}`
    onChange(value === newVal ? "" : newVal)
  }

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {MESES.map((m, i) => {
        const active = selectedMonth === i
        return (
          <button key={m} type="button" onClick={() => toggle(i)}
            style={{
              padding: "4px 10px", borderRadius: 20, border: active ? "1.5px solid #F472B6" : "1px solid #EDE8EA",
              background: active ? "#FDF2F8" : "#fff", color: active ? "#F472B6" : "#78716C",
              fontFamily: "inherit", fontSize: 12, fontWeight: active ? 700 : 500,
              cursor: "pointer", transition: "all .15s",
            }}>
            {m}
          </button>
        )
      })}
    </div>
  )
}

function DateFilterBar({ filterDay, filterMonth, onDayChange, onMonthChange, onClear, total, filtered, search, onSearchChange }:
  { filterDay: string; filterMonth: string; onDayChange: (v: string) => void; onMonthChange: (v: string) => void; onClear: () => void; total: number; filtered: number; search: string; onSearchChange: (v: string) => void }) {
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <label style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600, flexShrink: 0 }}>Mês:</label>
        <MonthSelect value={filterMonth} onChange={(v) => { onMonthChange(v); if (v) onDayChange("") }} />
      </div>
      {hasFilter && (
        <button onClick={onClear}
          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Limpar filtro
        </button>
      )}
      <div style={{ position: "relative", marginLeft: "auto" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2.5" strokeLinecap="round" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingLeft: 26, paddingRight: search ? 26 : 8, paddingTop: 5, paddingBottom: 5, border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, color: "#1C1917", background: search ? "#FDF2F8" : "#fff", outline: "none", width: 160 }}
        />
        {search && (
          <button onClick={() => onSearchChange("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, borderRadius: "50%", border: "none", background: "#E5E0DC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#78716C", fontFamily: "inherit" }}>✕</button>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600, whiteSpace: "nowrap" }}>
        {hasFilter || search ? `${filtered} de ${total}` : `${total} pedido(s)`}
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
        Próximo
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════
   MODAL WRAPPER (shared)
════════════════════════════════════════════ */
function ModalWrap({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, background: "#fff", borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,.16)",
        width: "min(520px,94vw)", maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        fontFamily: "inherit",
        animation: "modalIn .18s ease",
      }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:translate(-50%,-48%)}to{opacity:1;transform:translate(-50%,-50%)}}`}</style>
        {children}
      </div>
    </>
  )
}

/* ════════════════════════════════════════════
   ORDER MODAL (normal)
════════════════════════════════════════════ */
function OrderModal({ order, onClose, onUpdate }: { order: Pedido; onClose: () => void; onUpdate: (o: Pedido) => void }) {
  const [trackingCode, setTrackingCode] = useState(order.codigo_rastreio ?? "")
  const [advancing, setAdvancing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [converting, setConverting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editItems, setEditItems] = useState<ItemPedido[]>(order.items)
  const [saving, setSaving] = useState(false)
  const currentIdx = FLOW.indexOf(order.status)
  const next = NEXT_ACTION[order.status]
  const editTotal = editItems.reduce((s, it) => s + it.preco * (it.quantidade ?? 1), 0)

  function setQty(idx: number, delta: number) {
    setEditItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it
      const cur = it.quantidade ?? it.qty ?? 1
      const next = Math.max(1, cur + delta)
      return { ...it, quantidade: next, qty: next }
    }))
  }

  function removeItem(idx: number) {
    setEditItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function saveEdit() {
    if (editItems.length === 0) { alert("O pedido precisa ter pelo menos 1 item"); return }
    setSaving(true)
    const res = await fetch(`/api/pedidos/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: editItems, total: editTotal }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(updated as Pedido)
      setEditing(false)
    } else {
      alert("Erro ao salvar alterações")
    }
    setSaving(false)
  }

  async function advance() {
    if (!next) return
    setAdvancing(true)
    const nextStatus = FLOW[currentIdx + 1]
    const res = await fetch("/api/admin/pedidos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order.id, status: nextStatus }) })
    const data = await res.json()
    if (res.ok) onUpdate(data as Pedido)
    setAdvancing(false)
  }

  async function cancel() {
    if (!confirm("Cancelar este pedido?")) return
    setCancelling(true)
    const res = await fetch("/api/admin/pedidos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order.id, status: "cancelado" }) })
    const data = await res.json()
    if (res.ok) onUpdate(data as Pedido)
    setCancelling(false)
    onClose()
  }

  async function convertToConfianca() {
    if (!confirm("Converter para venda em confiança? O pedido entrará no fluxo de confiança (Separado).")) return
    setConverting(true)
    const res = await fetch("/api/admin/pedidos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order.id, tipo: "confianca", status: "cf_separado" }) })
    const data = await res.json()
    if (res.ok) onUpdate(data as Pedido)
    setConverting(false)
    onClose()
  }

  return (
    <ModalWrap onClose={onClose}>
      {/* Header */}
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
      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {editing ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>Editar itens</div>
            {editItems.map((it, i) => {
              const qty = it.quantidade ?? it.qty ?? 1
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F5F0F2" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.nome}</div>
                    <div style={{ fontSize: 11, color: "#A8A29E" }}>Tam. {it.tamanho} · {fmt(it.preco)} un.</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setQty(i, -1)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700, fontSize: 13 }}>{qty}</span>
                    <button onClick={() => setQty(i, 1)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    <button onClick={() => removeItem(i)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                  </div>
                  <div style={{ minWidth: 64, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{fmt(it.preco * qty)}</div>
                </div>
              )
            })}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 800, fontSize: 15 }}>
              <span>Total</span><span style={{ color: "#F472B6" }}>{fmt(editTotal)}</span>
            </div>
          </>
        ) : (
          <>
            <Timeline flow={FLOW} labels={FLOW_LABELS} currentIdx={currentIdx} />
            <ClienteCard nome={order.cliente_nome} telefone={order.cliente_telefone} />
            <ItemsList items={order.items} total={order.total} />

            {order.nota && (
              <div style={{ padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 12, color: "#92400E" }}>
                <span style={{ fontWeight: 700 }}>Nota: </span>{order.nota}
              </div>
            )}
          </>
        )}
      </div>
      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #EDE8EA", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        {editing ? (
          <>
            <button onClick={saveEdit} disabled={saving}
              style={{ display: "block", width: "100%", padding: 13, borderRadius: 8, border: "none", background: saving ? "#E5E0DC" : "#1C1917", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
            <button onClick={() => { setEditing(false); setEditItems(order.items) }}
              style={{ display: "block", width: "100%", padding: 12, borderRadius: 8, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Cancelar edição
            </button>
          </>
        ) : (
          <>
            {next && order.status !== "cancelado" && (
              <button onClick={advance} disabled={advancing}
                style={{ display: "block", width: "100%", padding: 13, borderRadius: 8, border: "none", background: advancing ? "#E5E0DC" : next.color, color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: advancing ? "not-allowed" : "pointer" }}>
                {advancing ? "Atualizando..." : next.label}
              </button>
            )}
            {order.status === "aguardando" && (
              <button onClick={() => setEditing(true)}
                style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #EDE8EA", background: "#FAFAF9", color: "#1C1917", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar pedido
              </button>
            )}
            {order.status === "aguardando" && (
              <button onClick={convertToConfianca} disabled={converting}
                style={{ display: "block", width: "100%", padding: 12, borderRadius: 8, border: "1px solid #DDD6FE", background: "#F3E8FF", color: "#6D28D9", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: converting ? "not-allowed" : "pointer" }}>
                {converting ? "Convertendo..." : "Converter para confiança"}
              </button>
            )}
            {order.status !== "cancelado" && order.status !== "entregue" && (
              <button onClick={cancel} disabled={cancelling}
                style={{ display: "block", width: "100%", padding: 12, borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                {cancelling ? "Cancelando..." : "Cancelar pedido"}
              </button>
            )}
          </>
        )}
      </div>
    </ModalWrap>
  )
}

/* ════════════════════════════════════════════
   CONFIANCA MODAL
════════════════════════════════════════════ */
function ConfiancaModal({ order, onClose, onUpdate }: { order: Pedido; onClose: () => void; onUpdate: (o: Pedido) => void }) {
  const [advancing, setAdvancing] = useState(false)
  const [returning, setReturning] = useState(false)
  const currentIdx = CF_FLOW.indexOf(order.status)

  async function advance() {
    if (currentIdx >= CF_FLOW.length - 1) return
    const nextStatus = CF_FLOW[currentIdx + 1]
    const willDeductStock = nextStatus === "cf_entregue"
    if (willDeductStock && !confirm("Isso irá baixar o estoque automaticamente para itens vinculados. Confirmar?")) return
    setAdvancing(true)
    const res = await fetch("/api/admin/pedidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, status: nextStatus, ...(willDeductStock ? { deductStock: true, items: order.items } : {}) }),
    })
    const data = await res.json()
    if (res.ok) onUpdate(data as Pedido)
    setAdvancing(false)
  }

  async function markDevolvido() {
    if (!confirm("Marcar como devolvido? Os itens vinculados retornarão ao estoque.")) return
    setReturning(true)
    const shouldRestore = order.status === "cf_entregue" || order.status === "cf_aguardando"
    const res = await fetch("/api/admin/pedidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, status: "cf_devolvido", ...(shouldRestore ? { restoreStock: true, items: order.items } : {}) }),
    })
    const data = await res.json()
    if (res.ok) onUpdate(data as Pedido)
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
    cf_pago:       { bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D", text: "Pagamento confirmado! Esta venda já aparece nas estatísticas." },
    cf_devolvido:  { bg: "#F5F5F4", border: "#EDE8EA", color: "#78716C", text: "Pecas devolvidas. Estoque restaurado." },
  }
  const info = statusInfo[order.status]

  return (
    <ModalWrap onClose={onClose}>
      {/* Header */}
      <div style={{ padding: "18px 20px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{order.cliente_nome}</div>
          <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 1 }}>Confiança - {fmtDate(order.criado_em)}</div>
        </div>
        <StatusPill status={order.status} meta={CF_STATUS_META} />
      </div>
      {/* Body */}
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
      {/* Footer */}
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
    </ModalWrap>
  )
}

/* ════════════════════════════════════════════
   NEW ORDER MODAL (normal)
════════════════════════════════════════════ */
function NewOrderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (o: Pedido) => void }) {
  const [nome, setNome] = useState(""); const [tel, setTel] = useState(""); const [nota, setNota] = useState("")
  const [items, setItems] = useState([{ nome: "", tamanho: "", quantidade: 1, preco: 0 }])
  const [saving, setSaving] = useState(false)
  const total = items.reduce((s, it) => s + it.preco * (it.quantidade ?? 1), 0)

  async function save() {
    if (!nome.trim() || !tel.trim()) { alert("Nome e telefone sao obrigatorios"); return }
    setSaving(true)
    const res = await fetch("/api/admin/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cliente_nome: nome, cliente_telefone: tel, items, total, nota: nota || null, status: "aguardando", tipo: "normal" }) })
    const data = await res.json()
    if (res.ok) onCreate(data as Pedido)
    setSaving(false); onClose()
  }

  return (
    <ModalWrap onClose={onClose}>
      <div style={{ padding: "18px 20px", borderBottom: "1px solid #EDE8EA", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Novo pedido</span>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style={{ padding: "18px 20px 20px", overflowY: "auto", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
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
            <div style={{ overflowX: "auto" }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 60px 70px 28px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                <input placeholder="Nome" value={it.nome} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} style={{ padding: "8px 10px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                <input placeholder="Tam." value={it.tamanho} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, tamanho: e.target.value } : x))} style={{ padding: "8px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                <input type="number" min={1} value={it.quantidade} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, quantidade: parseInt(e.target.value) || 1 } : x))} style={{ padding: "8px 6px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none", textAlign: "center" }} />
                <input type="number" min={0} step={0.01} placeholder="R$" value={it.preco || ""} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, preco: parseFloat(e.target.value) || 0 } : x))} style={{ padding: "8px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#A8A29E", fontSize: 18, padding: 0 }}>x</button>
              </div>
            ))}
            </div>
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
    </ModalWrap>
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
  const total = items.reduce((s, it) => s + it.preco * (it.quantidade ?? 1), 0)

  useEffect(() => {
    fetch("/api/admin/produtos").then((r) => r.json()).then((data) => setProdutos((Array.isArray(data) ? data : []) as Produto[]))
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
    const res = await fetch("/api/admin/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cliente_nome: nome, cliente_telefone: tel, items, total, nota: nota || null, status: "cf_separado", tipo: "confianca" }) })
    const data = await res.json()
    if (res.ok) onCreate(data as Pedido)
    setSaving(false); onClose()
  }

  return (
    <ModalWrap onClose={onClose}>
      <div style={{ padding: "18px 20px", borderBottom: "1px solid #EDE8EA", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Nova venda em confiança</span>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style={{ padding: "18px 20px 20px", overflowY: "auto", flex: 1 }}>
        <div style={{ fontSize: 12, color: "#6D28D9", marginBottom: 20, padding: "10px 12px", background: "#F3E8FF", borderRadius: 7, border: "1px solid #DDD6FE", fontWeight: 600 }}>
          Estoque e baixado na entrega. Receita conta somente ao confirmar pagamento.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 60px 80px", gap: 6 }}>
                  <input placeholder="Nome da peca" value={it.nome} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} style={{ padding: "8px 10px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                  <input placeholder="Tamanho" value={it.tamanho} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, tamanho: e.target.value } : x))} style={{ padding: "8px 10px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                  <input type="number" min={1} value={it.quantidade} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, quantidade: parseInt(e.target.value) || 1 } : x))} style={{ padding: "8px 6px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none", textAlign: "center" }} />
                  <input type="number" min={0} step={0.01} placeholder="R$" value={it.preco || ""} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, preco: parseFloat(e.target.value) || 0 } : x))} style={{ padding: "8px 8px", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                </div>
                {it.variacao_id && <div style={{ marginTop: 6, fontSize: 11, color: "#16A34A", fontWeight: 600 }}>Estoque vinculado — será baixado automaticamente na entrega</div>}
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
                {saving ? "Salvando..." : "Registrar confiança"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalWrap>
  )
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
const NORMAL_TABS = [
  { id: "aguardando", label: "Aguardando" },
  { id: "confirmado", label: "Confirmado" },
  { id: "separacao", label: "Separação" },
  { id: "entregue", label: "Entregue" },
]
const CF_TABS = [
  { id: "cf_separado", label: "Separado" },
  { id: "cf_entregue", label: "Entregue" },
  { id: "cf_aguardando", label: "Aguard. pag." },
  { id: "cf_pago", label: "Pago" },
  { id: "cf_devolvido", label: "Devolvido" },
]

function PedidosInner() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [mainTab, setMainTab] = useState<"normal" | "confianca">("normal")
  const [normalFilter, setNormalFilter] = useState("aguardando")
  const [cfFilter, setCfFilter] = useState("cf_separado")
  const [selected, setSelected] = useState<Pedido | null>(null)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showNewConfianca, setShowNewConfianca] = useState(false)

  const [normalDay, setNormalDay] = useState("")
  const [normalMonth, setNormalMonth] = useState("")
  const [cfDay, setCfDay] = useState("")
  const [cfMonth, setCfMonth] = useState("")
  const [normalSearch, setNormalSearch] = useState("")
  const [cfSearch, setCfSearch] = useState("")

  const [normalPage, setNormalPage] = useState(1)
  const [cfPage, setCfPage] = useState(1)

  const searchParams = useSearchParams()
  const autoOpenId = searchParams.get("pedido")
  const autoOpened = useRef(false)

  useEffect(() => {
    fetch("/api/admin/pedidos").then((r) => r.json()).then((rawData) => {
      const lista = (Array.isArray(rawData) ? rawData : []) as Pedido[]
      setPedidos(lista)
      setLoading(false)
      // Auto-open order from query param
      if (autoOpenId && !autoOpened.current) {
        autoOpened.current = true
        const target = lista.find((p) => p.id === autoOpenId)
        if (target) setSelected(target)
      }
    })
  }, [])

  function updateOrder(o: Pedido) {
    setPedidos((prev) => prev.map((p) => p.id === o.id ? o : p))
    setSelected(o)
    if (o.tipo === "confianca") setMainTab("confianca")
  }

  function handleNormalFilter(v: string) { setNormalFilter(v); setNormalPage(1) }
  function handleCfFilter(v: string) { setCfFilter(v); setCfPage(1) }
  function handleNormalDay(v: string) { setNormalDay(v); setNormalPage(1) }
  function handleNormalMonth(v: string) { setNormalMonth(v); setNormalPage(1) }
  function handleCfDay(v: string) { setCfDay(v); setCfPage(1) }
  function handleCfMonth(v: string) { setCfMonth(v); setCfPage(1) }
  function handleNormalSearch(v: string) { setNormalSearch(v); setNormalPage(1) }
  function handleCfSearch(v: string) { setCfSearch(v); setCfPage(1) }

  const normalOrders = pedidos.filter((p) => p.tipo === "normal" || !p.tipo)
  const cfOrders = pedidos.filter((p) => p.tipo === "confianca")

  const statusFilteredNormal = normalFilter === "todos" ? normalOrders : normalOrders.filter((p) => p.status === normalFilter)
  const statusFilteredCf = cfFilter === "todos" ? cfOrders : cfOrders.filter((p) => p.status === cfFilter)

  const dateFilteredNormal = applyDateFilter(statusFilteredNormal, normalDay, normalMonth)
  const dateFilteredCf = applyDateFilter(statusFilteredCf, cfDay, cfMonth)

  const searchFilteredNormal = normalSearch.trim() ? dateFilteredNormal.filter((p) => p.cliente_nome.toLowerCase().includes(normalSearch.trim().toLowerCase())) : dateFilteredNormal
  const searchFilteredCf = cfSearch.trim() ? dateFilteredCf.filter((p) => p.cliente_nome.toLowerCase().includes(cfSearch.trim().toLowerCase())) : dateFilteredCf

  const pagedNormal = searchFilteredNormal.slice((normalPage - 1) * PAGE_SIZE, normalPage * PAGE_SIZE)
  const pagedCf = searchFilteredCf.slice((cfPage - 1) * PAGE_SIZE, cfPage * PAGE_SIZE)

  const displayList = mainTab === "normal" ? pagedNormal : pagedCf
  const currentMeta = mainTab === "normal" ? STATUS_META : CF_STATUS_META
  const currentFiltered = mainTab === "normal" ? searchFilteredNormal.length : searchFilteredCf.length
  const currentTotal = mainTab === "normal" ? statusFilteredNormal.length : statusFilteredCf.length
  const currentPage = mainTab === "normal" ? normalPage : cfPage
  const currentSetPage = mainTab === "normal" ? setNormalPage : setCfPage

  function normalCount(id: string) { return id === "todos" ? normalOrders.length : normalOrders.filter((p) => p.status === id).length }
  function cfCount(id: string) { return id === "todos" ? cfOrders.length : cfOrders.filter((p) => p.status === id).length }

  const aReceber = cfOrders.filter((p) => p.status === "cf_entregue" || p.status === "cf_aguardando").reduce((s, p) => s + p.total, 0)

  const currentDay = mainTab === "normal" ? normalDay : cfDay
  const currentMonth = mainTab === "normal" ? normalMonth : cfMonth
  const currentHandleDay = mainTab === "normal" ? handleNormalDay : handleCfDay
  const currentHandleMonth = mainTab === "normal" ? handleNormalMonth : handleCfMonth
  const currentSearch = mainTab === "normal" ? normalSearch : cfSearch
  const currentHandleSearch = mainTab === "normal" ? handleNormalSearch : handleCfSearch
  const currentClearDate = mainTab === "normal"
    ? () => { setNormalDay(""); setNormalMonth(""); setNormalPage(1) }
    : () => { setCfDay(""); setCfMonth(""); setCfPage(1) }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917" }}>Pedidos</h1>
          <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 2 }}>Gerencie pedidos e vendas em confiança</p>
        </div>
        <Link href="/admin/pedidos/novo" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1C1917", color: "#fff", borderRadius: 6, padding: "9px 16px", fontWeight: 700, fontSize: 13, border: "none", fontFamily: "inherit", textDecoration: "none" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo pedido
        </Link>
      </div>

      {aReceber > 0 && (
        <div style={{ background: "#FEF9C3", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#92400E" }}>A receber em confiança: {fmt(aReceber)}</span>
          <span style={{ fontSize: 12, color: "#A8A29E", marginLeft: 8 }}>{cfOrders.filter((p) => p.status === "cf_entregue" || p.status === "cf_aguardando").length} venda(s) em aberto</span>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #EDE8EA" }}>
          {[{ id: "normal" as const, label: "Pedidos normais", count: normalOrders.length }, { id: "confianca" as const, label: "Confiança", count: cfOrders.length }].map((t) => (
            <button key={t.id} onClick={() => setMainTab(t.id)}
              style={{ flex: 1, padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: mainTab === t.id ? 800 : 600, fontSize: 14, color: mainTab === t.id ? "#F472B6" : "#78716C", borderBottom: "2px solid " + (mainTab === t.id ? "#F472B6" : "transparent") }}>
              {t.label}
              <span style={{ marginLeft: 7, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 800, background: mainTab === t.id ? "#FDF2F8" : "#F5F5F4", color: mainTab === t.id ? "#F472B6" : "#A8A29E" }}>{t.count}</span>
            </button>
          ))}
        </div>

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

        <DateFilterBar
          filterDay={currentDay}
          filterMonth={currentMonth}
          onDayChange={currentHandleDay}
          onMonthChange={currentHandleMonth}
          onClear={currentClearDate}
          total={currentTotal}
          filtered={currentFiltered}
          search={currentSearch}
          onSearchChange={currentHandleSearch}
        />

        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#A8A29E", fontWeight: 600 }}>Carregando...</div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#A8A29E" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Nenhum pedido encontrado</div>
            {(currentDay || currentMonth || currentSearch) && <div style={{ fontSize: 12, marginTop: 4 }}>Tente limpar os filtros</div>}
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

        <Pagination
          page={currentPage}
          total={currentFiltered}
          pageSize={PAGE_SIZE}
          onChange={currentSetPage}
        />
      </div>

      {selected && selected.tipo === "confianca" && (
        <ConfiancaModal order={selected} onClose={() => setSelected(null)} onUpdate={updateOrder} />
      )}
      {selected && selected.tipo !== "confianca" && (
        <OrderModal order={selected} onClose={() => setSelected(null)} onUpdate={updateOrder} />
      )}
      {showNewOrder && <NewOrderModal onClose={() => setShowNewOrder(false)} onCreate={(o) => setPedidos((p) => [o, ...p])} />}
      {showNewConfianca && <NewConfiancaModal onClose={() => setShowNewConfianca(false)} onCreate={(o) => { setPedidos((p) => [o, ...p]); setMainTab("confianca") }} />}
    </div>
  )
}

export default function PedidosPage() {
  return (
    <Suspense fallback={null}>
      <PedidosInner />
    </Suspense>
  )
}
