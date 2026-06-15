"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"


/* ── types ── */
interface Variacao { id: string; tamanho: string; quantidade_disponivel: number; quantidade_total: number }
interface Produto { id: string; nome: string; fotos: string[] | null; genero: string; estacao: string | null; status: string; variacoes: Variacao[] }

function getEstoqueStatus(variacoes: Variacao[]): "ok" | "baixo" | "esgotado" {
  if (variacoes.length === 0) return "esgotado"
  const total = variacoes.reduce((s, v) => s + v.quantidade_disponivel, 0)
  if (total === 0) return "esgotado"
  if (variacoes.some((v) => v.quantidade_disponivel > 0 && v.quantidade_disponivel <= 2)) return "baixo"
  return "ok"
}

const STATUS_DISPLAY = {
  ok:       { label: "Disponível",    bg: "#F0FDF4", color: "#16A34A", dot: "#4ADE80" },
  baixo:    { label: "Estoque baixo", bg: "#FEF9C3", color: "#92400E", dot: "#FBBF24" },
  esgotado: { label: "Esgotado",      bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
}

/* ── Modal de edição ── */
function StockDrawer({ produto, onClose, onSave }: { produto: Produto; onClose: () => void; onSave: (id: string, variacoes: Variacao[]) => void }) {
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(produto.variacoes.map((v) => [v.id, v.quantidade_disponivel]))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function adjust(id: string, delta: number) {
    setQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }))
  }

  async function handleSave() {
    setSaving(true)
    await Promise.all(
      produto.variacoes.map((v) =>
        fetch("/api/admin/estoque", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v.id, quantidade_disponivel: qtys[v.id] ?? v.quantidade_disponivel }) })
      )
    )
    const updated = produto.variacoes.map((v) => ({ ...v, quantidade_disponivel: qtys[v.id] ?? v.quantidade_disponivel }))
    onSave(produto.id, updated)
    setSaving(false)
    setSaved(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => { setSaved(false); onClose() }, 1600)
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: "min(460px,calc(100vw - 32px))", maxHeight: "90vh", background: "#fff", borderRadius: 14, boxShadow: "0 8px 40px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", animation: "modalIn .18s ease", fontFamily: "inherit" }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:translate(-50%,-46%)}to{opacity:1;transform:translate(-50%,-50%)}}`}</style>

        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C", fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.3 }}>{produto.nome}</div>
            <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 1, textTransform: "capitalize" }}>{produto.genero}{produto.estacao ? ` · ${produto.estacao}` : ""}</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 14 }}>Quantidade por tamanho</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {produto.variacoes.map((v) => {
              const val = qtys[v.id] ?? 0
              return (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#FAFAF9", borderRadius: 8, border: "1px solid #EDE8EA" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, minWidth: 32 }}>{v.tamanho}</div>
                  <div style={{ flex: 1 }}>
                    {val === 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FEF2F2", color: "#DC2626", borderRadius: 4, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>Esgotado</span>}
                    {val > 0 && val <= 2 && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FEF9C3", color: "#92400E", borderRadius: 4, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>Estoque baixo</span>}
                    {val > 2 && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F0FDF4", color: "#16A34A", borderRadius: 4, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{val} unidades</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => adjust(v.id, -1)} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontWeight: 700, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>−</button>
                    <input type="number" min={0} value={val} onChange={(e) => setQtys((prev) => ({ ...prev, [v.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      style={{ width: 52, height: 30, textAlign: "center", border: "1px solid #EDE8EA", borderRadius: 6, fontFamily: "inherit", fontWeight: 700, fontSize: 14, outline: "none" }} />
                    <button onClick={() => adjust(v.id, 1)} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontWeight: 700, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 20, padding: "14px", background: "#FAFAF9", borderRadius: 8, border: "1px solid #EDE8EA" }}>
            <div style={{ fontSize: 12, color: "#78716C", fontWeight: 600 }}>Total em estoque</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1C1917", marginTop: 4 }}>
              {Object.values(qtys).reduce((s, v) => s + v, 0)} unidades
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #EDE8EA", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {saved && (
            <div style={{ textAlign: "center", padding: "10px", background: "#F0FDF4", borderRadius: 8, color: "#16A34A", fontWeight: 700, fontSize: 13 }}>
              ✓ Estoque atualizado!
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{ display: "block", width: "100%", padding: 13, borderRadius: 8, border: "none", background: saving ? "#E5E0DC" : "#1C1917", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
          <button onClick={onClose} style={{ display: "block", width: "100%", padding: 12, borderRadius: 8, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Main page ── */
const TABS = [
  { id: "todos",    label: "Todos" },
  { id: "ok",       label: "Disponíveis" },
  { id: "baixo",    label: "Estoque baixo" },
  { id: "esgotado", label: "Esgotados" },
]

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("todos")
  const [editing, setEditing] = useState<Produto | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/estoque").then(r => r.json()).then(({ produtos: data }) => {
      const order = ["RN","P","M","G","1","2","3","4","6","8","10","12","14","16"]
      const mapped = (data ?? []).map((p: Record<string, unknown>) => ({
        id: p.id, nome: p.nome, fotos: p.fotos as string[] | null, genero: p.genero as string, estacao: p.estacao as string | null, status: p.status as string,
        variacoes: ((p.variacoes_estoque as Variacao[]) ?? []).sort((a, b) => order.indexOf(a.tamanho) - order.indexOf(b.tamanho)),
      }))
      setProdutos(mapped)
      setLoading(false)
    })
  }, [])

  function handleSave(id: string, variacoes: Variacao[]) {
    setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, variacoes } : p))
    setEditing((e) => e?.id === id ? { ...e, variacoes } : e)
  }

  const totalUnits = produtos.reduce((s, p) => s + p.variacoes.reduce((vs, v) => vs + v.quantidade_disponivel, 0), 0)
  const okCount = produtos.filter((p) => getEstoqueStatus(p.variacoes) === "ok").length
  const lowCount = produtos.filter((p) => getEstoqueStatus(p.variacoes) === "baixo").length
  const emptyCount = produtos.filter((p) => getEstoqueStatus(p.variacoes) === "esgotado").length

  const byTab = filter === "todos" ? produtos : produtos.filter((p) => getEstoqueStatus(p.variacoes) === filter)
  const filtered = search.trim() ? byTab.filter((p) => p.nome.toLowerCase().includes(search.trim().toLowerCase())) : byTab

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917" }}>Estoque</h1>
          <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 2 }}>Gerencie as quantidades por produto e tamanho</p>
        </div>
        <Link href="/admin/produtos/novo" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1C1917", color: "#fff", borderRadius: 6, padding: "9px 16px", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Novo produto
        </Link>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1, marginBottom: 4 }}>{totalUnits}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#78716C" }}>Unidades em estoque</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1, marginBottom: 4, color: "#16A34A" }}>{okCount}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#78716C" }}>Produtos disponíveis</div>
        </div>
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1, marginBottom: 4, color: "#92400E" }}>{lowCount}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#78716C" }}>Com estoque baixo</div>
        </div>
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1, marginBottom: 4, color: "#DC2626" }}>{emptyCount}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#78716C" }}>Esgotados</div>
        </div>
      </div>

      {/* Table card */}
      <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #EDE8EA" }} className="scrollbar-hide">
          {TABS.map((t) => {
            const count = t.id === "todos" ? produtos.length : t.id === "ok" ? okCount : t.id === "baixo" ? lowCount : emptyCount
            const active = filter === t.id
            return (
              <button key={t.id} onClick={() => setFilter(t.id)} style={{ padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 700 : 600, fontSize: 13, color: active ? "#F472B6" : "#78716C", borderBottom: `2px solid ${active ? "#F472B6" : "transparent"}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                {t.label}
                {count > 0 && <span style={{ marginLeft: 6, padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 800, background: active ? "#FDF2F8" : "#F5F5F4", color: active ? "#F472B6" : "#A8A29E" }}>{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #EDE8EA", background: "#FAFAF9" }}>
          <div style={{ position: "relative", maxWidth: 300 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2.5" strokeLinecap="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", paddingLeft: 32, paddingRight: search ? 30 : 10, paddingTop: 7, paddingBottom: 7, border: "1px solid #EDE8EA", borderRadius: 7, fontFamily: "inherit", fontSize: 13, color: "#1C1917", background: "#fff", outline: "none" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, borderRadius: "50%", border: "none", background: "#E5E0DC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C", fontSize: 9, fontWeight: 700, fontFamily: "inherit" }}>X</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#A8A29E", fontWeight: 600 }}>Carregando…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#A8A29E" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Nenhum produto aqui</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr style={{ background: "#FAFAF9", borderBottom: "1px solid #EDE8EA" }}>
                  {["Produto", "Status", "Tamanhos", "Total", ""].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((produto, i) => {
                  const st = STATUS_DISPLAY[getEstoqueStatus(produto.variacoes)]
                  const totalProduto = produto.variacoes.reduce((s, v) => s + v.quantidade_disponivel, 0)
                  return (
                    <tr key={produto.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F5F0F2" : "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAF9" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                      <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#FDF2F8", overflow: "hidden", flexShrink: 0, border: "1px solid #EDE8EA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {produto.fotos?.[0]
                              ? <img src={produto.fotos[0]} alt={produto.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <span style={{ fontSize: 16 }}>👗</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{produto.nome}</div>
                            <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 1, textTransform: "capitalize" }}>{produto.genero}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: st.bg, color: st.color, borderRadius: 4, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {produto.variacoes.map((v) => (
                            <span key={v.id} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: v.quantidade_disponivel === 0 ? "#FEF2F2" : v.quantidade_disponivel <= 2 ? "#FEF9C3" : "#F0FDF4", color: v.quantidade_disponivel === 0 ? "#DC2626" : v.quantidade_disponivel <= 2 ? "#92400E" : "#16A34A" }}>
                              {v.tamanho}: {v.quantidade_disponivel}
                            </span>
                          ))}
                          {produto.variacoes.length === 0 && <span style={{ fontSize: 12, color: "#A8A29E" }}>Sem variações</span>}
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{totalProduto}</div>
                        <div style={{ fontSize: 11, color: "#A8A29E" }}>unidades</div>
                      </td>
                      <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                        <button onClick={() => setEditing(produto)} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", color: "#1C1917", fontFamily: "inherit", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <StockDrawer produto={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  )
}
