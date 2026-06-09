"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/* ── types ── */
interface PedidoItem { name: string; size: string; qty: number; price: number }
interface Pedido {
  id: string
  cliente_nome: string
  cliente_telefone: string
  items: PedidoItem[]
  total: number
  status: string
  nota: string | null
  codigo_rastreio: string | null
  criado_em: string
}

/* ── constants ── */
const STATUS_META: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  aguardando: { label: "Aguardando", bg: "#FEF9C3", color: "#92400E", dot: "#FBBF24" },
  confirmado:  { label: "Confirmado", bg: "#EFF6FF", color: "#1D4ED8", dot: "#60A5FA" },
  separacao:   { label: "Separação",  bg: "#FAF5FF", color: "#7C3AED", dot: "#A78BFA" },
  enviado:     { label: "Enviado",    bg: "#FFF7ED", color: "#C2410C", dot: "#FB923C" },
  entregue:    { label: "Entregue",   bg: "#F0FDF4", color: "#16A34A", dot: "#4ADE80" },
  cancelado:   { label: "Cancelado",  bg: "#F5F5F4", color: "#78716C", dot: "#A8A29E" },
}

const FLOW = ["aguardando", "confirmado", "separacao", "enviado", "entregue"] as const
const FLOW_LABELS: Record<string, string> = {
  aguardando: "Aguardando", confirmado: "Confirmado",
  separacao: "Em separação", enviado: "Enviado", entregue: "Entregue",
}
const NEXT_ACTION: Record<string, { label: string; color: string; tracking?: boolean }> = {
  aguardando: { label: "Confirmar pedido",    color: "#16A34A" },
  confirmado:  { label: "Iniciar separação",   color: "#7C3AED" },
  separacao:   { label: "Marcar como enviado", color: "#C2410C", tracking: true },
  enviado:     { label: "Confirmar entrega",   color: "#16A34A" },
}

/* ── status pill ── */
function Pill({ status }: { status: string }) {
  const st = STATUS_META[status] ?? STATUS_META.aguardando
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: st.bg, color: st.color, borderRadius: 4, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0, display: "inline-block" }} />
      {st.label}
    </span>
  )
}

/* ── Order drawer ── */
function OrderDrawer({ order, onClose, onUpdate }: {
  order: Pedido
  onClose: () => void
  onUpdate: (id: string, update: Partial<Pedido>) => void
}) {
  const [tracking, setTracking] = useState(order.codigo_rastreio ?? "")
  const [loading, setLoading] = useState(false)
  const stepIdx = FLOW.indexOf(order.status as typeof FLOW[number])
  const next = NEXT_ACTION[order.status]
  const isDone = order.status === "entregue" || order.status === "cancelado"

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])

  async function advance() {
    if (!next) return
    if (next.tracking && !tracking.trim()) return
    setLoading(true)
    const supabase = createClient()
    const nextStatus = FLOW[stepIdx + 1]
    const update: Partial<Pedido> = { status: nextStatus }
    if (next.tracking) update.codigo_rastreio = tracking.trim()
    await supabase.from("pedidos").update(update).eq("id", order.id)
    onUpdate(order.id, update)
    setLoading(false)
  }

  async function cancel() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from("pedidos").update({ status: "cancelado" }).eq("id", order.id)
    onUpdate(order.id, { status: "cancelado" })
    setLoading(false)
  }

  const whatsappMsg = encodeURIComponent(
    `Olá ${order.cliente_nome.split(" ")[0]}! Atualização sobre seu pedido na Margarida Kids:`
  )
  const date = new Date(order.criado_em).toLocaleDateString("pt-BR")
  const time = new Date(order.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "min(420px,100vw)", background: "#fff",
        boxShadow: "-4px 0 24px rgba(0,0,0,.08)",
        display: "flex", flexDirection: "column",
        animation: "slideIn .2s ease",
        fontFamily: "inherit",
      }}>
        <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C", fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Pedido #{order.id.slice(0, 8)}</div>
            <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 1 }}>{date} às {time}</div>
          </div>
          {order.status !== "cancelado" && <Pill status={order.status} />}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

          {/* Progress timeline */}
          {order.status !== "cancelado" && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 12 }}>Progresso</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {FLOW.map((s, i) => {
                  const done = i <= stepIdx
                  const curr = i === stepIdx
                  return (
                    <div key={s} style={{ display: "contents" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700,
                          background: done ? (curr ? "#F472B6" : "#1C1917") : "#EDE8EA",
                          color: done ? "#fff" : "#A8A29E",
                          border: curr ? "2px solid #F472B6" : "none",
                          boxSizing: "border-box",
                        }}>
                          {done && !curr ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : i + 1}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: done ? "#1C1917" : "#A8A29E", textAlign: "center", maxWidth: 48, lineHeight: 1.3 }}>{FLOW_LABELS[s]}</div>
                      </div>
                      {i < FLOW.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: i < stepIdx ? "#1C1917" : "#EDE8EA", marginBottom: 20, marginLeft: 2, marginRight: 2 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Customer */}
          <div style={{ background: "#FAFAF9", borderRadius: 8, padding: 14, marginBottom: 16, border: "1px solid #EDE8EA" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>Cliente</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{order.cliente_nome}</div>
                <div style={{ fontSize: 12, color: "#78716C" }}>{order.cliente_telefone}</div>
              </div>
              <a href={`https://wa.me/${order.cliente_telefone}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 6, background: "#25D366", color: "#fff", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>
            {order.nota && <div style={{ fontSize: 12, color: "#78716C", marginTop: 10, padding: "8px 10px", background: "#fff", borderRadius: 6, border: "1px solid #EDE8EA" }}>💬 {order.nota}</div>}
          </div>

          {/* Items */}
          <div style={{ background: "#FAFAF9", borderRadius: 8, padding: 14, marginBottom: 16, border: "1px solid #EDE8EA" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>Itens do pedido</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, border: "1px solid #EDE8EA" }}>👗</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#78716C" }}>Tam. {item.size} · {item.qty}x</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#F472B6", flexShrink: 0 }}>
                    {(item.price * item.qty).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid #EDE8EA" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#1C1917" }}>
                {order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>

          {/* Tracking code if sent */}
          {order.status === "enviado" && order.codigo_rastreio && (
            <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C2410C", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Código de rastreio</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1C1917" }}>{order.codigo_rastreio}</div>
            </div>
          )}

          {/* Tracking input if moving to enviado */}
          {order.status === "separacao" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 6 }}>
                Código de rastreio (obrigatório)
              </label>
              <input
                type="text"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="BR123456789"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #EDE8EA", fontFamily: "inherit", fontSize: 13, color: "#1C1917", outline: "none" }}
                onFocus={(e) => { e.target.style.borderColor = "#F472B6" }}
                onBlur={(e) => { e.target.style.borderColor = "#EDE8EA" }}
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!isDone && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #EDE8EA", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            {next && (
              <button onClick={advance} disabled={loading || (next.tracking && !tracking.trim())}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: 13, borderRadius: 8, border: "none",
                  background: next.color, color: "#fff",
                  fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  opacity: loading || (next.tracking && !tracking.trim()) ? 0.55 : 1,
                  transition: "filter .15s",
                }}>
                {loading ? "Salvando…" : next.label}
              </button>
            )}
            {order.status !== "cancelado" && (
              <button onClick={cancel} disabled={loading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", padding: 12, borderRadius: 8,
                  border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626",
                  fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}>
                Cancelar pedido
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

/* ── New order modal ── */
function NewOrderModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Pedido) => void }) {
  const [nome, setNome] = useState("")
  const [tel, setTel] = useState("")
  const [nota, setNota] = useState("")
  const [items, setItems] = useState<PedidoItem[]>([{ name: "", size: "", qty: 1, price: 0 }])
  const [loading, setLoading] = useState(false)

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  function addItem() { setItems((p) => [...p, { name: "", size: "", qty: 1, price: 0 }]) }
  function removeItem(idx: number) { setItems((p) => p.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, field: keyof PedidoItem, val: string | number) {
    setItems((p) => p.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  }

  async function save() {
    if (!nome.trim() || !tel.trim() || items.some(i => !i.name.trim())) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from("pedidos").insert({
      cliente_nome: nome.trim(),
      cliente_telefone: tel.trim().replace(/\D/g, ""),
      items, total, nota: nota.trim() || null, status: "aguardando",
    }).select().single()
    if (data) onSave(data as Pedido)
    setLoading(false)
    onClose()
  }

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #EDE8EA", fontFamily: "inherit", fontSize: 13, color: "#1C1917", outline: "none", background: "#fff" }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
        background: "#fff", borderRadius: "16px 16px 0 0",
        boxShadow: "0 -4px 24px rgba(0,0,0,.10)",
        maxHeight: "92vh", display: "flex", flexDirection: "column",
        fontFamily: "inherit",
      }}>
        <div style={{ padding: "0 20px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 3, background: "#E5E0DC", borderRadius: 2, margin: "12px auto 16px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid #EDE8EA" }}>
            <span style={{ fontWeight: 800, fontSize: 17 }}>Novo pedido</span>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#78716C", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 5 }}>Nome do cliente</label>
                <input style={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Maria Silva"
                  onFocus={(e) => { e.target.style.borderColor = "#F472B6" }} onBlur={(e) => { e.target.style.borderColor = "#EDE8EA" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 5 }}>WhatsApp</label>
                <input style={inputStyle} value={tel} onChange={(e) => setTel(e.target.value)} placeholder="5511999999999"
                  onFocus={(e) => { e.target.style.borderColor = "#F472B6" }} onBlur={(e) => { e.target.style.borderColor = "#EDE8EA" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#78716C" }}>Itens</label>
                <button onClick={addItem} style={{ fontSize: 12, color: "#F472B6", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ Adicionar item</button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 60px 50px 80px 24px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                  <input style={{ ...inputStyle, fontSize: 12 }} value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} placeholder="Nome do produto"
                    onFocus={(e) => { e.target.style.borderColor = "#F472B6" }} onBlur={(e) => { e.target.style.borderColor = "#EDE8EA" }} />
                  <input style={{ ...inputStyle, fontSize: 12, textAlign: "center" }} value={item.size} onChange={(e) => updateItem(idx, "size", e.target.value)} placeholder="Tam"
                    onFocus={(e) => { e.target.style.borderColor = "#F472B6" }} onBlur={(e) => { e.target.style.borderColor = "#EDE8EA" }} />
                  <input style={{ ...inputStyle, fontSize: 12, textAlign: "center" }} type="number" min={1} value={item.qty} onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value) || 1)}
                    onFocus={(e) => { e.target.style.borderColor = "#F472B6" }} onBlur={(e) => { e.target.style.borderColor = "#EDE8EA" }} />
                  <input style={{ ...inputStyle, fontSize: 12 }} type="number" min={0} step={0.01} value={item.price || ""} onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)} placeholder="R$"
                    onFocus={(e) => { e.target.style.borderColor = "#F472B6" }} onBlur={(e) => { e.target.style.borderColor = "#EDE8EA" }} />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A8A29E", fontSize: 16, padding: 0, fontFamily: "inherit" }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#78716C", display: "block", marginBottom: 5 }}>Observação (opcional)</label>
              <textarea style={{ ...inputStyle, resize: "none" }} rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Preferência de entrega, cor etc."
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#F472B6" }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#EDE8EA" }} />
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 20px 36px", borderTop: "1px solid #EDE8EA", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontWeight: 600, color: "#78716C", fontSize: 14 }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 18 }}>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>
          <button onClick={save} disabled={loading || !nome.trim() || !tel.trim()}
            style={{
              display: "block", width: "100%", padding: 14, borderRadius: 8, border: "none",
              background: nome.trim() && tel.trim() ? "#1C1917" : "#E5E0DC",
              color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 15,
              cursor: nome.trim() && tel.trim() ? "pointer" : "not-allowed",
            }}>
            {loading ? "Salvando…" : "Criar pedido"}
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Main page ── */
const TABS = [
  { id: "todos",     label: "Todos" },
  { id: "aguardando",label: "Aguardando" },
  { id: "confirmado",label: "Confirmado" },
  { id: "separacao", label: "Separação" },
  { id: "enviado",   label: "Enviado" },
  { id: "entregue",  label: "Entregue" },
]

export default function PedidosPage() {
  const [orders, setOrders] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("todos")
  const [selected, setSelected] = useState<Pedido | null>(null)
  const [newModal, setNewModal] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from("pedidos").select("*").order("criado_em", { ascending: false }).then(({ data }) => {
      setOrders((data ?? []) as Pedido[])
      setLoading(false)
    })
  }, [])

  function updateOrder(id: string, update: Partial<Pedido>) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, ...update } : o))
    setSelected((s) => s?.id === id ? { ...s, ...update } : s)
  }

  function addOrder(p: Pedido) {
    setOrders((prev) => [p, ...prev])
  }

  const filtered = filter === "todos" ? orders : orders.filter((o) => o.status === filter)
  const pendingCount = orders.filter((o) => o.status === "aguardando").length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917" }}>Pedidos</h1>
          <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 2 }}>Gerencie e valide as vendas recebidas via WhatsApp</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pendingCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#FEF9C3", borderRadius: 6, border: "1px solid #FDE68A" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FBBF24" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>
                {pendingCount} aguardando confirmação
              </span>
            </div>
          )}
          <button onClick={() => setNewModal(true)} style={{
            background: "#1C1917", color: "#fff", border: "none", borderRadius: 6,
            padding: "9px 16px", fontFamily: "inherit", fontWeight: 700, fontSize: 13,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo pedido
          </button>
        </div>
      </div>

      {/* Filter tabs + list */}
      <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #EDE8EA" }} className="scrollbar-hide">
          {TABS.map((t) => {
            const count = t.id === "todos" ? orders.length : orders.filter((o) => o.status === t.id).length
            const active = filter === t.id
            return (
              <button key={t.id} onClick={() => setFilter(t.id)} style={{
                padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: active ? 700 : 600, fontSize: 13,
                color: active ? "#F472B6" : "#78716C",
                borderBottom: `2px solid ${active ? "#F472B6" : "transparent"}`,
                whiteSpace: "nowrap", flexShrink: 0, transition: "color .15s",
              }}>
                {t.label}
                {count > 0 && (
                  <span style={{ marginLeft: 6, padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 800, background: active ? "#FDF2F8" : "#F5F5F4", color: active ? "#F472B6" : "#A8A29E" }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#A8A29E" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Carregando…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#A8A29E" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Nenhum pedido aqui</div>
            <div style={{ fontSize: 13 }}>
              {filter === "todos" ? "Clique em \"Novo pedido\" para registrar o primeiro." : "Altere o filtro para ver outros pedidos."}
            </div>
          </div>
        ) : filtered.map((order) => {
          const st = STATUS_META[order.status] ?? STATUS_META.aguardando
          const summary = order.items.map((i) => `${i.name.split(" ").slice(0, 2).join(" ")} (${i.size})`).join(", ")
          const date = new Date(order.criado_em).toLocaleDateString("pt-BR")
          const time = new Date(order.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          return (
            <div key={order.id}
              onClick={() => setSelected(order)}
              style={{ padding: "14px 18px", borderBottom: "1px solid #F5F0F2", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "background .1s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAF9" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{order.cliente_nome}</span>
                  <span style={{ fontSize: 12, color: "#A8A29E" }}>#{order.id.slice(0, 8)}</span>
                  <Pill status={order.status} />
                </div>
                <div style={{ fontSize: 12, color: "#78716C", marginBottom: 2 }}>{summary || "Sem itens"}</div>
                <div style={{ fontSize: 11, color: "#A8A29E" }}>{date} às {time}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#F472B6" }}>
                    {order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  <div style={{ fontSize: 11, color: "#A8A29E" }}>{order.items.length} iten{order.items.length !== 1 ? "s" : ""}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <OrderDrawer
          key={selected.id}
          order={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateOrder}
        />
      )}
      {newModal && (
        <NewOrderModal onClose={() => setNewModal(false)} onSave={addOrder} />
      )}
    </div>
  )
}
