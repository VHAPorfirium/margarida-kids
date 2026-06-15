"use client"

import { useMemo, useRef, useState, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImageOff } from "lucide-react"
import type { ProdutoComVariacoes } from "@/lib/types"

interface CartItem {
  id: string
  produto: ProdutoComVariacoes
  tamanho: string
  qty: number
}

const PAGE_SIZE = 10

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function SizePill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: "#F5F5F4", color: "#78716C" }}>
      {children}
    </span>
  )
}

function ProdutoCard({ produto, cartQty, onOpen }: { produto: ProdutoComVariacoes; cartQty: number; onOpen: () => void }) {
  const tamanhosDisponiveis = produto.variacoes_estoque.filter((v) => v.quantidade_disponivel > 0)
  const ultimasUnidades = tamanhosDisponiveis.some((v) => v.quantidade_disponivel <= 2)
  return (
    <button type="button" onClick={onOpen}
      style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column", textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%" }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"; el.style.transform = "translateY(-2px)" }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "none"; el.style.transform = "none" }}
    >
      <div style={{ position: "relative", background: "#FDF2F8", aspectRatio: "1", overflow: "hidden" }}>
        {produto.fotos?.[0] ? (
          <Image src={produto.fotos[0]} alt={produto.nome} fill style={{ objectFit: "cover" }} sizes="(min-width:768px) 33vw,50vw" />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageOff size={32} color="#A8A29E" />
          </div>
        )}
        {ultimasUnidades && (
          <div style={{ position: "absolute", bottom: 8, left: 8, background: "#FEF9C3", color: "#92400E", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
            Últimas unidades
          </div>
        )}
        {cartQty > 0 && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(28,25,23,0.82)", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
            No carrinho - {cartQty}
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.35, color: "#1C1917" }}>{produto.nome}</div>
        {tamanhosDisponiveis.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {tamanhosDisponiveis.slice(0, 5).map((v) => <SizePill key={v.id}>{v.tamanho}</SizePill>)}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#F472B6" }}>
            {produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
          <span style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", color: "#1C1917", fontSize: 12, fontWeight: 600 }}>
            Ver produto
          </span>
        </div>
      </div>
    </button>
  )
}

function ProdutoModal({ produto, onClose, onAdd }: {
  produto: ProdutoComVariacoes
  onClose: () => void
  onAdd: (produto: ProdutoComVariacoes, tamanho: string) => void
}) {
  const [tamanho, setTamanho] = useState(produto.variacoes_estoque.find((v) => v.quantidade_disponivel > 0)?.tamanho ?? "")
  const [fotoIdx, setFotoIdx] = useState(0)
  const fotos = produto.fotos ?? []
  const tamDisponiveis = produto.variacoes_estoque.filter((v) => v.quantidade_disponivel > 0)
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 101, background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxHeight: "90vh", width: "min(560px, 92vw)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* Header com X */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#1C1917", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{produto.nome}</span>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {/* Foto principal com setas */}
        <div style={{ position: "relative", background: "#FDF2F8", overflow: "hidden", flexShrink: 0, aspectRatio: "4/3", width: "100%" }}>
          {fotos[fotoIdx] ? (
            <Image src={fotos[fotoIdx]} alt={produto.nome} fill style={{ objectFit: "contain" }} sizes="560px" />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageOff size={48} color="#A8A29E" />
            </div>
          )}
          {fotos.length > 1 && (
            <>
              <button type="button" onClick={() => setFotoIdx((i) => (i - 1 + fotos.length) % fotos.length)}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", color: "#1C1917" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button type="button" onClick={() => setFotoIdx((i) => (i + 1) % fotos.length)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", color: "#1C1917" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              {/* Dots */}
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                {fotos.map((_, i) => (
                  <button key={i} type="button" onClick={() => setFotoIdx(i)} style={{ width: i === fotoIdx ? 20 : 7, height: 7, borderRadius: 4, background: i === fotoIdx ? "#F472B6" : "rgba(255,255,255,0.8)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s" }} />
                ))}
              </div>
            </>
          )}
        </div>
        {/* Miniaturas */}
        {fotos.length > 1 && (
          <div style={{ display: "flex", gap: 8, padding: "10px 16px 0", overflowX: "auto" }}>
            {fotos.map((foto, i) => (
              <button key={foto} type="button" onClick={() => setFotoIdx(i)} style={{ width: 60, height: 60, borderRadius: 8, cursor: "pointer", flexShrink: 0, border: `2px solid ${i === fotoIdx ? "#F472B6" : "#EDE8EA"}`, overflow: "hidden", position: "relative", background: "#FDF2F8", padding: 0 }}>
                <Image src={foto} alt="" fill style={{ objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
        {/* Info */}
        <div style={{ padding: "16px 16px 24px", overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: 4, background: "#F5F5F4", color: "#78716C", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{produto.genero}</span>
            {produto.estacao && <span style={{ padding: "3px 10px", borderRadius: 4, background: "#F5F5F4", color: "#78716C", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{produto.estacao === "verao" ? "Verão" : produto.estacao === "inverno" ? "Inverno" : produto.estacao === "primavera" ? "Primavera" : produto.estacao === "outono" ? "Outono" : "Todas as estações"}</span>}
            {tamDisponiveis.some((v) => v.quantidade_disponivel <= 2) && <span style={{ padding: "3px 10px", borderRadius: 4, background: "#FEF9C3", color: "#92400E", fontSize: 11, fontWeight: 700 }}>Últimas unidades</span>}
          </div>
          <div style={{ fontWeight: 800, fontSize: 24, color: "#F472B6", marginBottom: 14 }}>
            {produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          {produto.descricao && <p style={{ color: "#78716C", fontSize: 14, lineHeight: 1.75, marginBottom: 22 }}>{produto.descricao}</p>}
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.5px", textTransform: "uppercase", color: "#A8A29E", marginBottom: 10 }}>Tamanho</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {produto.variacoes_estoque.map((v) => {
              const disp = v.quantidade_disponivel > 0
              const sel = tamanho === v.tamanho
              return (
                <button key={v.id} type="button" disabled={!disp} onClick={() => setTamanho(v.tamanho)}
                  style={{ minWidth: 48, height: 44, padding: "0 12px", borderRadius: 6, border: `1px solid ${sel ? "#F472B6" : "#EDE8EA"}`, cursor: disp ? "pointer" : "not-allowed", fontFamily: "inherit", fontWeight: 700, fontSize: 14, background: sel ? "#F472B6" : "#fff", color: sel ? "#fff" : disp ? "#78716C" : "#D4CFCC", textDecoration: disp ? "none" : "line-through", transition: "all 0.12s" }}>
                  {v.tamanho}
                </button>
              )
            })}
          </div>
          <button type="button" disabled={!tamanho || tamDisponiveis.length === 0} onClick={() => { onAdd(produto, tamanho); onClose() }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: 14, borderRadius: 8, border: "none", background: tamanho ? "#1C1917" : "#E5E0DC", color: "#fff", marginBottom: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: tamanho ? "pointer" : "not-allowed" }}>
            Adicionar ao carrinho
          </button>
          <button type="button" onClick={onClose} style={{ display: "block", width: "100%", padding: 13, borderRadius: 8, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Continuar vendo
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Modal de autenticação + finalizar pedido ────────────────────────────────

interface AuthCheckoutProps {
  cart: CartItem[]
  totalPreco: number
  nomeCliente: string
  telefoneSessao: string
  onClose: () => void
  onSuccess: () => void
}

function AuthCheckoutModal({ cart, totalPreco, nomeCliente, telefoneSessao, onClose, onSuccess }: AuthCheckoutProps) {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  const router = useRouter()

  function buildMsg(nome: string) {
    const lines = cart.map((i) =>
      `${i.produto.nome} - Tam. ${i.tamanho} - ${i.qty}x - ${(i.produto.preco * i.qty).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
    ).join("\n")
    return encodeURIComponent(`Ola, sou ${nome}! Quero fazer um pedido:\n\n${lines}\n\nTotal: ${totalPreco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`)
  }

  async function registrarEAbrir(nome: string, tel: string) {
    const items = cart.map((i) => ({
      produto_id: i.produto.id,
      nome: i.produto.nome,
      tamanho: i.tamanho,
      qty: i.qty,
      preco: i.produto.preco,
    }))
    try {
      await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_nome: nome, cliente_telefone: tel, items, total: totalPreco }),
      })
    } catch { /* silencioso */ }
    if (numero) window.open(`https://wa.me/${numero}?text=${buildMsg(nome)}`, "_blank")
    router.refresh()
    onSuccess()
  }

  // ── Se já logado ──────────────────────────────────────────────────────────
  if (nomeCliente && telefoneSessao) {
    return <ConfirmarPedidoModal
      cart={cart}
      totalPreco={totalPreco}
      nomeCliente={nomeCliente}
      onClose={onClose}
      onConfirmar={() => registrarEAbrir(nomeCliente, telefoneSessao)}
    />
  }

  // ── Se não logado ─────────────────────────────────────────────────────────
  return <LoginRegisterModal onClose={onClose} onSuccess={registrarEAbrir} />
}

function ConfirmarPedidoModal({ cart, totalPreco, nomeCliente, onClose, onConfirmar }: {
  cart: CartItem[]
  totalPreco: number
  nomeCliente: string
  onClose: () => void
  onConfirmar: () => void
}) {
  const [loading, setLoading] = useState(false)
  const primeiroNome = nomeCliente.split(" ")[0]
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 301, background: "#fff", borderRadius: 16, padding: "28px 24px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", width: "min(460px, 92vw)", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>X</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F472B6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
            {primeiroNome[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1C1917" }}>Ola, {primeiroNome}!</div>
            <div style={{ fontSize: 12, color: "#78716C" }}>Confirmar pedido via WhatsApp</div>
          </div>
        </div>
        <div style={{ border: "1px solid #EDE8EA", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {cart.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#44403C" }}>
              <span style={{ fontWeight: 600 }}>{item.produto.nome} <span style={{ color: "#A8A29E", fontWeight: 400 }}>({item.tamanho}) x{item.qty}</span></span>
              <span style={{ fontWeight: 700 }}>{(item.produto.preco * item.qty).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #EDE8EA", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#1C1917", fontSize: 14 }}>Total</span>
            <span style={{ fontWeight: 800, color: "#F472B6", fontSize: 16 }}>{totalPreco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>
        </div>
        <button type="button" disabled={loading} onClick={async () => { setLoading(true); await onConfirmar() }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: 15, borderRadius: 8, border: "none", background: loading ? "#A8A29E" : "#25D366", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", marginBottom: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {loading ? "Aguarde..." : "Confirmar e abrir WhatsApp"}
        </button>
        <button type="button" onClick={onClose} style={{ display: "block", width: "100%", padding: 13, borderRadius: 8, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          Voltar
        </button>
      </div>
    </>
  )
}

function LoginRegisterModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (nome: string, telefone: string) => void
}) {
  const [aba, setAba] = useState<"entrar" | "cadastrar">("entrar")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  // login fields
  const [lTelefone, setLTelefone] = useState("")
  const [lSenha, setLSenha] = useState("")
  const [lShowSenha, setLShowSenha] = useState(false)

  // register fields
  const [rNome, setRNome] = useState("")
  const [rTelefone, setRTelefone] = useState("")
  const [rSenha, setRSenha] = useState("")
  const [rConfirmar, setRConfirmar] = useState("")
  const [rShowSenha, setRShowSenha] = useState(false)

  const senhaOk = rSenha.length >= 8 && /[A-Z]/.test(rSenha)

  async function handleLogin() {
    setErro("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: lTelefone.replace(/\D/g, ""), senha: lSenha }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? "Erro ao entrar"); setLoading(false); return }
      await onSuccess(data.nome, data.telefone)
    } catch { setErro("Erro de conexão"); setLoading(false) }
  }

  async function handleRegister() {
    setErro("")
    if (rSenha !== rConfirmar) { setErro("Senhas não coincidem"); return }
    if (!senhaOk) { setErro("Senha fraca — mín. 8 caracteres e 1 maiúscula"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: rNome, telefone: rTelefone.replace(/\D/g, ""), senha: rSenha }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? "Erro ao cadastrar"); setLoading(false); return }
      await onSuccess(data.nome, data.telefone)
    } catch { setErro("Erro de conexão"); setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #EDE8EA",
    borderRadius: 8, fontFamily: "inherit", fontSize: 14, color: "#1C1917", background: "#FAFAF9", outline: "none",
  }
  const labelStyle: React.CSSProperties = {
    display: "block", fontWeight: 700, fontSize: 11, color: "#78716C",
    textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 5,
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 301, background: "#fff", borderRadius: 16, padding: "28px 24px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", width: "min(440px, 92vw)", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>X</button>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#1C1917", marginBottom: 4 }}>Entre para finalizar</div>
          <div style={{ fontSize: 13, color: "#78716C" }}>Salve seu histórico de pedidos</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderRadius: 8, background: "#F5F5F4", padding: 4, marginBottom: 22, gap: 4 }}>
          {(["entrar", "cadastrar"] as const).map((t) => (
            <button key={t} type="button" onClick={() => { setAba(t); setErro("") }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, background: aba === t ? "#fff" : "transparent", color: aba === t ? "#1C1917" : "#78716C", boxShadow: aba === t ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "all 0.15s" }}>
              {t === "entrar" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {aba === "entrar" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input type="tel" placeholder="(00) 00000-0000" value={lTelefone} onChange={(e) => setLTelefone(maskTelefone(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Senha</label>
              <div style={{ position: "relative" }}>
                <input type={lShowSenha ? "text" : "password"} placeholder="Sua senha" value={lSenha} onChange={(e) => setLSenha(e.target.value)} style={{ ...inputStyle, paddingRight: 40 }} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                <button type="button" onClick={() => setLShowSenha(!lShowSenha)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#A8A29E", fontSize: 12, fontFamily: "inherit" }}>
                  {lShowSenha ? "ocultar" : "ver"}
                </button>
              </div>
            </div>
            {erro && <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>{erro}</p>}
            <button type="button" disabled={loading} onClick={handleLogin}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: 14, borderRadius: 8, border: "none", background: loading ? "#A8A29E" : "#25D366", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {loading ? "Aguarde..." : "Entrar e finalizar"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Nome completo</label>
              <input type="text" placeholder="Seu nome" value={rNome} onChange={(e) => setRNome(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input type="tel" placeholder="(00) 00000-0000" value={rTelefone} onChange={(e) => setRTelefone(maskTelefone(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Senha</label>
              <div style={{ position: "relative" }}>
                <input type={rShowSenha ? "text" : "password"} placeholder="Min. 8 chars, 1 maiúscula" value={rSenha} onChange={(e) => setRSenha(e.target.value)} style={{ ...inputStyle, paddingRight: 40 }} />
                <button type="button" onClick={() => setRShowSenha(!rShowSenha)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#A8A29E", fontSize: 12, fontFamily: "inherit" }}>
                  {rShowSenha ? "ocultar" : "ver"}
                </button>
              </div>
              {rSenha.length > 0 && (
                <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: rSenha.length >= 8 ? "#86EFAC" : "#FCA5A5" }} />
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: /[A-Z]/.test(rSenha) ? "#86EFAC" : "#FCA5A5" }} />
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Confirmar senha</label>
              <input type="password" placeholder="Repita a senha" value={rConfirmar} onChange={(e) => setRConfirmar(e.target.value)} style={{ ...inputStyle, borderColor: rConfirmar && rConfirmar !== rSenha ? "#FCA5A5" : "#EDE8EA" }} />
            </div>
            {erro && <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>{erro}</p>}
            <button type="button" disabled={loading} onClick={handleRegister}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: 14, borderRadius: 8, border: "none", background: loading ? "#A8A29E" : "#25D366", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {loading ? "Aguarde..." : "Cadastrar e finalizar"}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── CartDrawer ───────────────────────────────────────────────────────────────

function CartDrawer({ cart, nomeCliente, telefoneSessao, onClose, onUpdateQty, onRemove, onClearCart }: {
  cart: CartItem[]
  nomeCliente: string
  telefoneSessao: string
  onClose: () => void
  onUpdateQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
  onClearCart: () => void
}) {
  const [checkout, setCheckout] = useState(false)
  const totalQty = cart.reduce((s, i) => s + i.qty, 0)
  const totalPreco = cart.reduce((s, i) => s + i.produto.preco * i.qty, 0)
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", width: "min(560px, 92vw)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid #EDE8EA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 17, color: "#1C1917" }}>Carrinho</span>
              {totalQty > 0 && <span style={{ background: "#F472B6", color: "#fff", borderRadius: 4, padding: "2px 9px", fontSize: 11, fontWeight: 800 }}>{totalQty}</span>}
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>X</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#A8A29E" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Seu carrinho está vazio</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Adicione produtos para continuar</div>
            </div>
          ) : cart.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 8, border: "1px solid #EDE8EA", background: "#FAFAF9" }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, background: "#FDF2F8", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                {item.produto.fotos?.[0] ? (
                  <Image src={item.produto.fotos[0]} alt={item.produto.nome} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>-</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5, lineHeight: 1.3, color: "#1C1917" }}>{item.produto.nome}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ background: "#F5F5F4", color: "#78716C", borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>Tam. {item.tamanho}</span>
                  <span style={{ fontWeight: 800, color: "#F472B6", fontSize: 13 }}>
                    {(item.produto.preco * item.qty).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <button type="button" onClick={() => onUpdateQty(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>-</button>
                <span style={{ fontWeight: 800, fontSize: 13, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                <button type="button" onClick={() => onUpdateQty(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
                <button type="button" onClick={() => onRemove(item.id)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "#FEF2F2", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626", fontFamily: "inherit" }}>X</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: "16px 20px 20px", borderTop: "1px solid #EDE8EA", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 600, color: "#78716C", fontSize: 14 }}>Total do pedido</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#1C1917" }}>
                {totalPreco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <button type="button" onClick={() => setCheckout(true)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", background: "#25D366", color: "#fff", borderRadius: 8, padding: 15, marginBottom: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Finalizar pelo WhatsApp
            </button>
            <button type="button" onClick={onClose} style={{ display: "block", width: "100%", padding: 13, borderRadius: 8, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Continuar comprando
            </button>
          </div>
        )}
      </div>
      {checkout && (
        <AuthCheckoutModal
          cart={cart}
          totalPreco={totalPreco}
          nomeCliente={nomeCliente}
          telefoneSessao={telefoneSessao}
          onClose={() => setCheckout(false)}
          onSuccess={() => { setCheckout(false); onClearCart(); onClose() }}
        />
      )}
    </>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null
  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }
  const btn = (content: React.ReactNode, p: number | null, active = false, disabled = false) => (
    <button key={String(content)} type="button" disabled={disabled || p === null} onClick={() => p !== null && onPage(p)}
      style={{ minWidth: 34, height: 34, borderRadius: 6, border: active ? "none" : "1px solid #EDE8EA", background: active ? "#F472B6" : disabled ? "#F5F5F4" : "#fff", color: active ? "#fff" : disabled ? "#D4CFCC" : "#1C1917", cursor: disabled || p === null ? "default" : "pointer", fontFamily: "inherit", fontWeight: active ? 700 : 600, fontSize: 13, padding: "0 6px" }}>
      {content}
    </button>
  )
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 28, flexWrap: "wrap" }}>
      {btn("<", page > 1 ? page - 1 : null, false, page === 1)}
      {pages.map((p, i) =>
        p === "..."
          ? <span key={"e" + i} style={{ padding: "0 2px", color: "#A8A29E", fontSize: 13 }}>...</span>
          : btn(p, p as number, p === page)
      )}
      {btn(">", page < totalPages ? page + 1 : null, false, page === totalPages)}
    </div>
  )
}

const GENDER_CATS = [
  { value: "todos",     label: "Tudo" },
  { value: "feminino",  label: "Menina" },
  { value: "masculino", label: "Menino" },
  { value: "unissex",   label: "Unissex" },
]

const SEASON_CATS = [
  { value: "todas",     label: "Todas as estações" },
  { value: "verao",     label: "Verão" },
  { value: "inverno",   label: "Inverno" },
  { value: "primavera", label: "Primavera" },
  { value: "outono",    label: "Outono" },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function CatalogoClient({ produtos, nomeCliente, telefoneSessao }: {
  produtos: ProdutoComVariacoes[]
  nomeCliente: string
  telefoneSessao: string
}) {
  const [cat, setCat] = useState("todos")
  const [estacao, setEstacao] = useState("todas")
  const [idadeFilter, setIdadeFilter] = useState("todas")
  const [tamanhoFilter, setTamanhoFilter] = useState("todos")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [produtoAberto, setProdutoAberto] = useState<ProdutoComVariacoes | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pop, setPop] = useState(false)
  const [toast, setToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetPage = useCallback(() => setPage(1), [])
  function handleCat(v: string) { setCat(v); resetPage() }
  function handleEstacao(v: string) { setEstacao(v); resetPage() }
  function handleIdade(v: string) { setIdadeFilter(v); resetPage() }
  function handleTamanho(v: string) { setTamanhoFilter(v); resetPage() }
  function handleSearch(v: string) { setSearch(v); resetPage() }

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    return produtos.filter((p) => {
      if (cat !== "todos" && p.genero !== cat) return false
      if (estacao !== "todas" && p.estacao !== estacao) return false
      if (idadeFilter !== "todas" && p.faixa_etaria !== idadeFilter) return false
      if (tamanhoFilter !== "todos" && !p.variacoes_estoque.some((v) => v.tamanho === tamanhoFilter && v.quantidade_disponivel > 0)) return false
      if (q && !p.nome.toLowerCase().includes(q)) return false
      return true
    })
  }, [produtos, cat, estacao, idadeFilter, tamanhoFilter, search])

  const paginados = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtrados.slice(start, start + PAGE_SIZE)
  }, [filtrados, page])

  const totalQty = cart.reduce((s, i) => s + i.qty, 0)

  function addToCart(produto: ProdutoComVariacoes, tamanho: string) {
    const key = `${produto.id}-${tamanho}`
    setCart((prev) => {
      const ex = prev.find((i) => i.id === key)
      if (ex) return prev.map((i) => i.id === key ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: key, produto, tamanho, qty: 1 }]
    })
    setProdutoAberto(null)
    setPop(true)
    if (popTimer.current) clearTimeout(popTimer.current)
    popTimer.current = setTimeout(() => setPop(false), 360)
    setToast(false)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    requestAnimationFrame(() => {
      setToast(true)
      toastTimer.current = setTimeout(() => setToast(false), 2200)
    })
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0))
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  function getQty(produtoId: string) {
    return cart.filter((i) => i.produto.id === produtoId).reduce((s, i) => s + i.qty, 0)
  }

  const primeiroNome = nomeCliente ? nomeCliente.split(" ")[0] : ""

  return (
    <>
      {toast && (
        <div style={{ position: "fixed", top: 18, left: "50%", zIndex: 500, background: "#1C1917", color: "#fff", borderRadius: 6, padding: "10px 18px", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", pointerEvents: "none", animation: "toastIn 2.2s ease forwards", transform: "translateX(-50%)", fontFamily: "inherit" }}>
          Adicionado ao carrinho
        </div>
      )}
      <style>{`@keyframes toastIn{0%{opacity:0;transform:translateX(-50%) translateY(-6px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1}100%{opacity:0}}.si::placeholder{color:#A8A29E}.si:focus{outline:none;border-color:#F472B6;box-shadow:0 0 0 3px rgba(244,114,182,0.12)}`}</style>

      {/* Header fixo */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", borderBottom: "1px solid #EDE8EA" }}>
        {/* Topo: logo centralizada + login à direita */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 16px 6px" }}>
          <Image src="/logo.png" alt="Margarida Kids" width={110} height={110} style={{ objectFit: "contain" }} priority />
          <div style={{ position: "absolute", right: 16 }}>
            {nomeCliente ? (
              <a href="/meu-historico" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", background: "#FDF2F8", border: "1px solid #FBCFE8", borderRadius: 20, padding: "6px 12px" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#F472B6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                  {primeiroNome[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#BE185D" }}>{primeiroNome}</span>
              </a>
            ) : (
              <a href="/login" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", padding: "7px 14px", borderRadius: 20, border: "1px solid #EDE8EA", background: "#fff" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#78716C" }}>Entrar</span>
              </a>
            )}
          </div>
        </div>

        {/* Busca centralizada */}
        <div style={{ padding: "0 16px 0", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 211 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input className="si" type="text" placeholder="Buscar produto..." value={search} onChange={(e) => handleSearch(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", paddingLeft: 34, paddingRight: search ? 34 : 12, paddingTop: 7, paddingBottom: 7, border: "1px solid #EDE8EA", borderRadius: 8, background: "#FAFAF9", fontFamily: "inherit", fontSize: 13, color: "#1C1917", transition: "border-color 0.15s" }}
            />
            {search && (
              <button type="button" onClick={() => handleSearch("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, borderRadius: "50%", border: "none", background: "#E5E0DC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C", fontSize: 9, fontWeight: 700, fontFamily: "inherit" }}>X</button>
            )}
          </div>
        </div>

        {/* Tabs gênero */}
        <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
          {GENDER_CATS.map((c) => (
            <button key={c.value} type="button" onClick={() => handleCat(c.value)}
              style={{ padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: cat === c.value ? 700 : 600, fontSize: 14, color: cat === c.value ? "#F472B6" : "#78716C", borderBottom: `2px solid ${cat === c.value ? "#F472B6" : "transparent"}`, whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.15s" }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Tabs estação */}
        <div style={{ display: "flex", justifyContent: "center", overflowX: "auto", borderTop: "1px solid #F5F0F2" }}>
          {SEASON_CATS.map((c) => (
            <button key={c.value} type="button" onClick={() => handleEstacao(c.value)}
              style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: estacao === c.value ? 700 : 600, fontSize: 12, color: estacao === c.value ? "#F472B6" : "#A8A29E", borderBottom: `2px solid ${estacao === c.value ? "#F472B6" : "transparent"}`, whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.15s" }}>
              {c.label}
            </button>
          ))}
        </div>
        {/* Dropdowns: Idade e Tamanho */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "8px 16px 10px", borderTop: "1px solid #F5F0F2" }}>
          <select
            value={idadeFilter}
            onChange={(e) => handleIdade(e.target.value)}
            style={{ padding: "6px 28px 6px 10px", borderRadius: 8, border: `1px solid ${idadeFilter !== "todas" ? "#F472B6" : "#EDE8EA"}`, background: idadeFilter !== "todas" ? "#FDF2F8" : "#FAFAF9", color: idadeFilter !== "todas" ? "#BE185D" : "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 12, cursor: "pointer", appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A8A29E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", minWidth: 120 }}
          >
            <option value="todas">Todas as idades</option>
            <option value="0-2 anos">0 – 2 anos</option>
            <option value="2-4 anos">2 – 4 anos</option>
            <option value="4-6 anos">4 – 6 anos</option>
            <option value="6-8 anos">6 – 8 anos</option>
            <option value="8-10 anos">8 – 10 anos</option>
          </select>
          <select
            value={tamanhoFilter}
            onChange={(e) => handleTamanho(e.target.value)}
            style={{ padding: "6px 28px 6px 10px", borderRadius: 8, border: `1px solid ${tamanhoFilter !== "todos" ? "#F472B6" : "#EDE8EA"}`, background: tamanhoFilter !== "todos" ? "#FDF2F8" : "#FAFAF9", color: tamanhoFilter !== "todos" ? "#BE185D" : "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 12, cursor: "pointer", appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A8A29E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", minWidth: 100 }}
          >
            <option value="todos">Todos os tamanhos</option>
            <option value="RN">RN</option>
            <option value="P">P</option>
            <option value="M">M</option>
            <option value="G">G</option>
            <option value="GG">GG</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="10">10</option>
            <option value="12">12</option>
          </select>
        </div>
      </header>

      <main style={{ padding: "20px 16px 120px", maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ fontSize: 12, color: "#A8A29E", fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {filtrados.length} produto{filtrados.length !== 1 ? "s" : ""}
          {filtrados.length > PAGE_SIZE && <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 6 }}>- pagina {page} de {Math.ceil(filtrados.length / PAGE_SIZE)}</span>}
        </p>
        {filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#A8A29E" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Nenhum produto encontrado</div>
            <div style={{ fontSize: 13 }}>{search ? `Nenhum resultado para "${search}"` : "Tente outros filtros"}</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {paginados.map((p) => (
                <ProdutoCard key={p.id} produto={p} cartQty={getQty(p.id)} onOpen={() => setProdutoAberto(p)} />
              ))}
            </div>
            <Pagination page={page} total={filtrados.length} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }) }} />
          </>
        )}
      </main>

      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 20px", borderTop: "1px solid #EDE8EA", background: "#fff", zIndex: 5 }}>
        <span style={{ color: "#A8A29E", fontSize: 12 }}>Margarida Kids — Feito com carinho</span>
      </footer>

      {totalQty > 0 && (
        <button type="button" onClick={() => setCartOpen(true)}
          style={{ position: "fixed", bottom: 52, right: 20, zIndex: 90, background: "#1C1917", color: "#fff", border: "none", borderRadius: 8, padding: "12px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", transition: "transform 0.15s", transform: pop ? "scale(1.1)" : "scale(1)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.98-1.72l1.5-8.28H6" />
          </svg>
          Ver carrinho
          <span style={{ background: "#F472B6", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 800, lineHeight: 1.4 }}>{totalQty}</span>
        </button>
      )}

      {produtoAberto && (
        <ProdutoModal key={produtoAberto.id} produto={produtoAberto} onClose={() => setProdutoAberto(null)} onAdd={addToCart} />
      )}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          nomeCliente={nomeCliente}
          telefoneSessao={telefoneSessao}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onClearCart={() => setCart([])}
        />
      )}
    </>
  )
}
