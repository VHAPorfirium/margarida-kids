"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"
import type { ProdutoComVariacoes } from "@/lib/types"

/* ─── types ─── */
interface CartItem {
  id: string
  produto: ProdutoComVariacoes
  tamanho: string
  qty: number
}

/* ─── Size pill ─── */
function SizePill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: "#F5F5F4", color: "#78716C" }}>
      {children}
    </span>
  )
}

/* ─── Product card ─── */
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
            No carrinho · {cartQty}
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

/* ─── Product modal (bottom sheet) ─── */
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
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101, background: "#fff", borderRadius: "16px 16px 0 0", boxShadow: "0 -4px 24px rgba(0,0,0,0.10)", maxHeight: "94vh", overflowY: "auto" }}>
        <div style={{ padding: "0 20px 40px" }}>
          <div style={{ width: 36, height: 3, background: "#E5E0DC", borderRadius: 2, margin: "14px auto 20px" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, width: 32, height: 32, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>✕</button>

          <div style={{ height: 220, borderRadius: 10, background: "#FDF2F8", overflow: "hidden", marginBottom: 10, position: "relative" }}>
            {fotos[fotoIdx] ? (
              <Image src={fotos[fotoIdx]} alt={produto.nome} fill style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ImageOff size={48} color="#A8A29E" />
              </div>
            )}
          </div>

          {fotos.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 22, overflowX: "auto" }}>
              {fotos.map((foto, i) => (
                <button key={foto} type="button" onClick={() => setFotoIdx(i)} style={{ width: 68, height: 68, borderRadius: 8, cursor: "pointer", flexShrink: 0, border: `1.5px solid ${i === fotoIdx ? "#F472B6" : "#EDE8EA"}`, overflow: "hidden", position: "relative", background: "#FDF2F8" }}>
                  <Image src={foto} alt="" fill style={{ objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: 4, background: "#F5F5F4", color: "#78716C", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{produto.genero}</span>
            {produto.estacao && <span style={{ padding: "3px 10px", borderRadius: 4, background: "#F5F5F4", color: "#78716C", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{produto.estacao === "verao" ? "Verão" : produto.estacao === "inverno" ? "Inverno" : produto.estacao === "primavera" ? "Primavera" : produto.estacao === "outono" ? "Outono" : "Todas as estações"}</span>}
            {tamDisponiveis.some((v) => v.quantidade_disponivel <= 2) && <span style={{ padding: "3px 10px", borderRadius: 4, background: "#FEF9C3", color: "#92400E", fontSize: 11, fontWeight: 700 }}>Últimas unidades</span>}
          </div>

          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6, lineHeight: 1.3, color: "#1C1917" }}>{produto.nome}</h2>
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

/* ─── Cart drawer ─── */
function CartDrawer({ cart, onClose, onUpdateQty, onRemove }: {
  cart: CartItem[]
  onClose: () => void
  onUpdateQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
}) {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0)
  const totalPreco = cart.reduce((s, i) => s + i.produto.preco * i.qty, 0)
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

  function buildMsg() {
    const lines = cart.map((i) =>
      `${i.produto.nome} — Tamanho ${i.tamanho} — ${i.qty}x — ${(i.produto.preco * i.qty).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
    ).join("\n")
    return encodeURIComponent(`Olá Margarida! Gostaria de fazer um pedido:\n\n${lines}\n\nTotal: ${totalPreco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} 😊`)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, background: "#fff", borderRadius: "16px 16px 0 0", boxShadow: "0 -4px 24px rgba(0,0,0,.10)", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 20px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 3, background: "#E5E0DC", borderRadius: 2, margin: "12px auto 16px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid #EDE8EA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 17, color: "#1C1917" }}>Carrinho</span>
              {totalQty > 0 && <span style={{ background: "#F472B6", color: "#fff", borderRadius: 4, padding: "2px 9px", fontSize: 11, fontWeight: 800 }}>{totalQty}</span>}
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F5F4", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#A8A29E" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>—</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Seu carrinho está vazio</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Adicione produtos para continuar</div>
            </div>
          ) : cart.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 8, border: "1px solid #EDE8EA", background: "#FAFAF9" }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, background: "#FDF2F8", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                {item.produto.fotos?.[0] ? (
                  <Image src={item.produto.fotos[0]} alt={item.produto.nome} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👗</div>
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
                <button type="button" onClick={() => onUpdateQty(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>−</button>
                <span style={{ fontWeight: 800, fontSize: 13, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                <button type="button" onClick={() => onUpdateQty(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #EDE8EA", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
                <button type="button" onClick={() => onRemove(item.id)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "#FEF2F2", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626", fontFamily: "inherit" }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: "16px 20px 36px", borderTop: "1px solid #EDE8EA", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 600, color: "#78716C", fontSize: 14 }}>Total do pedido</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#1C1917" }}>
                {totalPreco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <a href={numero ? `https://wa.me/${numero}?text=${buildMsg()}` : "#"} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#25D366", color: "#fff", borderRadius: 8, padding: 15, marginBottom: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Finalizar pelo WhatsApp
            </a>
            <button type="button" onClick={onClose} style={{ display: "block", width: "100%", padding: 13, borderRadius: 8, border: "1px solid #EDE8EA", background: "#fff", color: "#78716C", fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Continuar comprando
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Main component ─── */
const GENDER_CATS = [
  { value: "todos",     label: "Tudo" },
  { value: "feminino",  label: "Menina" },
  { value: "masculino", label: "Menino" },
  { value: "unissex",   label: "Unissex" },
]

const SEASON_CATS = [
  { value: "todas",    label: "Todas as estações" },
  { value: "verao",    label: "Verão" },
  { value: "inverno",  label: "Inverno" },
  { value: "primavera",label: "Primavera" },
  { value: "outono",   label: "Outono" },
]

export function CatalogoClient({ produtos }: { produtos: ProdutoComVariacoes[] }) {
  const [cat, setCat] = useState("todos")
  const [estacao, setEstacao] = useState("todas")
  const [produtoAberto, setProdutoAberto] = useState<ProdutoComVariacoes | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pop, setPop] = useState(false)
  const [toast, setToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtrados = useMemo(() => {
    return produtos.filter((p) => {
      if (cat !== "todos" && p.genero !== cat) return false
      if (estacao !== "todas" && p.estacao !== estacao) return false
      return true
    })
  }, [produtos, cat, estacao])

  const totalQty = cart.reduce((s, i) => s + i.qty, 0)

  function addToCart(produto: ProdutoComVariacoes, tamanho: string) {
    const key = `${produto.id}-${tamanho}`
    setCart((prev) => {
      const ex = prev.find((i) => i.id === key)
      if (ex) return prev.map((i) => i.id === key ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: key, produto, tamanho, qty: 1 }]
    })
    setProdutoAberto(null)
    // FAB pop animation
    setPop(true)
    if (popTimer.current) clearTimeout(popTimer.current)
    popTimer.current = setTimeout(() => setPop(false), 360)
    // Toast
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

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 18, left: "50%", zIndex: 500,
          background: "#1C1917", color: "#fff",
          borderRadius: 6, padding: "10px 18px",
          fontWeight: 600, fontSize: 13,
          whiteSpace: "nowrap", pointerEvents: "none",
          animation: "toastIn 2.2s ease forwards",
          transform: "translateX(-50%)",
          fontFamily: "inherit",
        }}>
          ✓ Adicionado ao carrinho
        </div>
      )}
      <style>{`@keyframes toastIn{0%{opacity:0;transform:translateX(-50%) translateY(-6px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1}100%{opacity:0}}`}</style>

      {/* Sticky two-row filter */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EDE8EA", position: "sticky", top: 0, zIndex: 10 }}>
        {/* Gender row */}
        <div style={{ display: "flex", overflowX: "auto" }} className="scrollbar-hide">
          {GENDER_CATS.map((c) => (
            <button key={c.value} type="button" onClick={() => setCat(c.value)}
              style={{ padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: cat === c.value ? 700 : 600, fontSize: 14, color: cat === c.value ? "#F472B6" : "#78716C", borderBottom: `2px solid ${cat === c.value ? "#F472B6" : "transparent"}`, whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.15s" }}>
              {c.label}
            </button>
          ))}
        </div>
        {/* Season row */}
        <div style={{ display: "flex", overflowX: "auto", borderTop: "1px solid #F5F0F2" }} className="scrollbar-hide">
          {SEASON_CATS.map((c) => (
            <button key={c.value} type="button" onClick={() => setEstacao(c.value)}
              style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: estacao === c.value ? 700 : 600, fontSize: 12, color: estacao === c.value ? "#F472B6" : "#A8A29E", borderBottom: `2px solid ${estacao === c.value ? "#F472B6" : "transparent"}`, whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.15s" }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main style={{ padding: "20px 16px 100px", maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ fontSize: 12, color: "#A8A29E", fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {filtrados.length} produto{filtrados.length !== 1 ? "s" : ""}
        </p>
        {filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#A8A29E" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Nenhum produto encontrado</div>
            <div style={{ fontSize: 13 }}>Tente outros filtros</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }} className="product-grid">
            {filtrados.map((p) => (
              <ProdutoCard key={p.id} produto={p} cartQty={getQty(p.id)} onOpen={() => setProdutoAberto(p)} />
            ))}
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "20px", color: "#A8A29E", fontSize: 12, borderTop: "1px solid #EDE8EA", background: "#fff" }}>
        Margarida Kids — Feito com cuidado 🌼
      </footer>

      {/* Cart FAB */}
      {totalQty > 0 && (
        <button type="button" onClick={() => setCartOpen(true)}
          style={{ position: "fixed", bottom: 24, right: 20, zIndex: 90, background: "#1C1917", color: "#fff", border: "none", borderRadius: 8, padding: "12px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", transition: "transform 0.15s", transform: pop ? "scale(1.1)" : "scale(1)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.98-1.72l1.5-8.28H6" />
          </svg>
          Ver carrinho
          <span style={{ background: "#F472B6", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 800, lineHeight: 1.4 }}>
            {totalQty}
          </span>
        </button>
      )}

      {produtoAberto && (
        <ProdutoModal key={produtoAberto.id} produto={produtoAberto} onClose={() => setProdutoAberto(null)} onAdd={addToCart} />
      )}
      {cartOpen && (
        <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onUpdateQty={updateQty} onRemove={removeItem} />
      )}
    </>
  )
}
