"use client"
import Image from "next/image"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ItemPedido {
  nome: string
  tamanho: string
  qty: number
  quantidade?: number
  preco: number
}

interface Pedido {
  id: string
  items: ItemPedido[]
  total: number
  status: string
  tipo: string
  criado_em: string
}

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const STATUS_LABEL: Record<string, string> = {
  aguardando:    "Aguardando",
  confirmado:    "Confirmado",
  separacao:     "Em separação",
  enviado:       "Enviado",
  entregue:      "Entregue",
  cancelado:     "Cancelado",
  cf_aguardando: "Aguardando",
  cf_confirmado: "Confirmado",
  cf_separacao:  "Em separação",
  cf_enviado:    "Enviado",
  cf_entregue:   "Entregue",
  cf_cancelado:  "Cancelado",
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  aguardando: { bg: "#FEF9C3", color: "#92400E" },
  confirmado: { bg: "#DBEAFE", color: "#1E40AF" },
  separacao:  { bg: "#EDE9FE", color: "#5B21B6" },
  enviado:    { bg: "#DCFCE7", color: "#166534" },
  entregue:   { bg: "#F0FDF4", color: "#15803D" },
  cancelado:  { bg: "#FEE2E2", color: "#991B1B" },
}

function statusStyle(status: string) {
  const base = status.replace("cf_", "")
  return STATUS_COLOR[base] ?? { bg: "#F5F5F4", color: "#78716C" }
}

function fmt(v: number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function PedidoCard({ pedido, onUpdate }: { pedido: Pedido; onUpdate: (p: Pedido) => void }) {
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [editItems, setEditItems] = useState<ItemPedido[]>(pedido.items)
  const [salvando, setSalvando] = useState(false)

  const data = new Date(pedido.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
  const { bg, color } = statusStyle(pedido.status)
  const editTotal = editItems.reduce((s, it) => s + it.preco * (it.qty ?? it.quantidade ?? 1), 0)

  function setQty(idx: number, delta: number) {
    setEditItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it
      const cur = it.qty ?? it.quantidade ?? 1
      const next = Math.max(1, cur + delta)
      return { ...it, qty: next, quantidade: next }
    }))
  }

  function removeItem(idx: number) {
    setEditItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function salvar() {
    if (editItems.length === 0) { alert("O pedido precisa ter pelo menos 1 item"); return }
    setSalvando(true)
    const res = await fetch(`/api/pedidos/${pedido.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: editItems, total: editTotal }),
    })
    if (res.ok) {
      const updated = await res.json() as Pedido
      onUpdate(updated)
      setEditando(false)
    } else {
      alert("Erro ao salvar alterações")
    }
    setSalvando(false)
  }

  function cancelarEdicao() {
    setEditItems(pedido.items)
    setEditando(false)
  }

  const podeEditar = pedido.status === "aguardando"

  return (
    <div style={{ border: "1px solid #EDE8EA", borderRadius: 10, background: "#fff", overflow: "hidden" }}>
      {/* Header do card */}
      <button type="button" onClick={() => { setAberto((v) => !v); if (editando) setEditando(false) }}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: "#A8A29E", fontWeight: 600 }}>{data}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1917" }}>
            {pedido.items?.length ?? 0} {pedido.items?.length === 1 ? "item" : "itens"} · {fmt(pedido.total)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>
            {STATUS_LABEL[pedido.status] ?? pedido.status}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2.5"
            style={{ transform: aberto ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Conteúdo expandido */}
      {aberto && (
        <div style={{ borderTop: "1px solid #EDE8EA", padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {editando ? (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>
                Editar itens
              </p>
              {editItems.map((item, i) => {
                const qty = item.qty ?? item.quantidade ?? 1
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #F5F0F2" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nome}</div>
                      <div style={{ fontSize: 11, color: "#A8A29E" }}>Tam. {item.tamanho} · {fmt(item.preco)} un.</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setQty(i, -1)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700, fontSize: 13 }}>{qty}</span>
                      <button onClick={() => setQty(i, 1)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      <button onClick={() => removeItem(i)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                    <div style={{ minWidth: 60, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{fmt(item.preco * qty)}</div>
                  </div>
                )
              })}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontWeight: 800, fontSize: 14 }}>
                <span style={{ color: "#78716C" }}>Total</span>
                <span style={{ color: "#F472B6" }}>{fmt(editTotal)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={salvar} disabled={salvando}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: salvando ? "#A8A29E" : "#1C1917", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: salvando ? "not-allowed" : "pointer" }}>
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
                <button onClick={cancelarEdicao}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              {(pedido.items ?? []).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, gap: 8 }}>
                  <span style={{ color: "#1C1917", fontWeight: 600 }}>{item.nome}</span>
                  <span style={{ color: "#78716C", whiteSpace: "nowrap", flexShrink: 0 }}>
                    Tam. {item.tamanho} · {item.qty ?? item.quantidade ?? 1}x · {fmt(item.preco * (item.qty ?? item.quantidade ?? 1))}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #EDE8EA", paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14 }}>
                <span style={{ color: "#78716C" }}>Total</span>
                <span style={{ color: "#F472B6" }}>{fmt(pedido.total)}</span>
              </div>
              {podeEditar && (
                <button onClick={() => setEditando(true)}
                  style={{ marginTop: 4, width: "100%", padding: "10px 0", borderRadius: 8, border: "1px solid #EDE8EA", background: "#FAFAF9", color: "#1C1917", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar pedido
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function AuthForm({ onSuccess }: { onSuccess: () => void }) {
  const [modo, setModo] = useState<"login" | "cadastro">("login")
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  const senhaOk = senha.length >= 8 && /[A-Z]/.test(senha)
  const senhaForcaMsg = senha.length === 0 ? "" :
    senha.length < 8 ? "Mínimo 8 caracteres" :
    !/[A-Z]/.test(senha) ? "Precisa de pelo menos uma letra maiúscula" : ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (modo === "cadastro") {
      if (!nome.trim()) { setErro("Informe seu nome"); return }
      if (!senhaOk) { setErro(senhaForcaMsg || "Senha inválida"); return }
      if (senha !== confirmar) { setErro("As senhas não coincidem"); return }
    }
    const digits = telefone.replace(/\D/g, "")
    if (digits.length !== 11) { setErro("Telefone deve ter DDD + 9 dígitos"); return }
    if (!senha) { setErro("Informe a senha"); return }
    setLoading(true)
    const endpoint = modo === "login" ? "/api/auth/login" : "/api/auth/register"
    const body = modo === "login" ? { telefone: digits, senha } : { nome, telefone: digits, senha }
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErro(json.error ?? "Erro desconhecido"); return }
    onSuccess()
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "11px 14px",
    border: "1px solid #EDE8EA", borderRadius: 8, fontFamily: "inherit",
    fontSize: 14, color: "#1C1917", background: "#FAFAF9", outline: "none",
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "40px 16px" }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
          <Image src="/logo.png" alt="Margarida Kids" width={80} height={80} style={{ objectFit: "contain" }} />
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917", marginBottom: 6 }}>
          {modo === "login" ? "Acessar meus pedidos" : "Criar conta"}
        </h1>
        <p style={{ fontSize: 13, color: "#78716C" }}>
          {modo === "login" ? "Entre com seu telefone e senha" : "Cadastre-se para acompanhar seus pedidos"}
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {modo === "cadastro" && (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Nome</label>
            <input type="text" placeholder="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
          </div>
        )}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Telefone (WhatsApp)</label>
          <input type="tel" placeholder="(00) 9 0000-0000" value={telefone} onChange={(e) => setTelefone(maskTelefone(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Senha</label>
          <div style={{ position: "relative" }}>
            <input type={showSenha ? "text" : "password"} placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} style={{ ...inputStyle, paddingRight: 42 }} />
            <button type="button" onClick={() => setShowSenha((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A8A29E", padding: 0 }}>
              {showSenha
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
          {modo === "cadastro" && senhaForcaMsg && <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 5 }}>{senhaForcaMsg}</p>}
          {modo === "cadastro" && senhaOk && <p style={{ fontSize: 11, color: "#16A34A", marginTop: 5 }}>Senha válida ✓</p>}
        </div>
        {modo === "cadastro" && (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Confirmar senha</label>
            <div style={{ position: "relative" }}>
              <input type={showConfirmar ? "text" : "password"} placeholder="••••••••" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} style={{ ...inputStyle, paddingRight: 42, borderColor: confirmar && confirmar !== senha ? "#FCA5A5" : "#EDE8EA" }} />
              <button type="button" onClick={() => setShowConfirmar((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A8A29E", padding: 0 }}>
                {showConfirmar
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
            {confirmar && confirmar !== senha && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 5 }}>As senhas não coincidem</p>}
          </div>
        )}
        {erro && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>{erro}</div>
        )}
        <button type="submit" disabled={loading}
          style={{ padding: "13px 0", borderRadius: 8, border: "none", background: loading ? "#A8A29E" : "#1C1917", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
          {loading ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>
      <p style={{ textAlign: "center", fontSize: 13, color: "#78716C", marginTop: 20 }}>
        {modo === "login" ? "Ainda não tem conta? " : "Já tem conta? "}
        <button type="button" onClick={() => { setModo(modo === "login" ? "cadastro" : "login"); setErro("") }}
          style={{ background: "none", border: "none", color: "#F472B6", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
          {modo === "login" ? "Cadastre-se" : "Fazer login"}
        </button>
      </p>
    </div>
  )
}

export function HistoricoClient({
  nome,
  pedidos: pedidosInicial,
}: {
  nome: string
  pedidos: object[]
}) {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosInicial as Pedido[])

  function handleUpdate(updated: Pedido) {
    setPedidos((prev) => prev.map((p) => p.id === updated.id ? updated : p))
  }

  async function handleLogout() {
    setSaindo(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #EDE8EA", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#1C1917" }}>Meus pedidos</div>
          <div style={{ fontSize: 13, color: "#78716C", marginTop: 2 }}>Olá, {nome} 👋</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/catalago" style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #F472B6", background: "#FDF2F8", color: "#F472B6", fontFamily: "inherit", fontWeight: 600, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
            Ver catálogo
          </a>
          <button type="button" onClick={handleLogout} disabled={saindo}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            {saindo ? "..." : "Sair"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 60px" }}>
        {pedidos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#A8A29E" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Nenhum pedido ainda</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Seus pedidos aparecerão aqui após a compra</div>
            <a href="/catalago" style={{ display: "inline-block", marginTop: 20, padding: "10px 24px", background: "#1C1917", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              Ver catálogo
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 12, color: "#A8A29E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
            </p>
            {pedidos.map((p) => <PedidoCard key={p.id} pedido={p} onUpdate={handleUpdate} />)}
          </div>
        )}
      </div>
    </div>
  )
}
