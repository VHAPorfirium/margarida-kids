"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Produto, VariacaoEstoque } from "@/lib/types"

interface Cliente {
  id: string
  nome: string
  telefone: string
}

interface ItemPedido {
  produto_id: string
  variacao_id: string | null
  nome: string
  tamanho: string
  quantidade: number
  preco: number
  foto: string
}

interface ProdutoComVariacoes extends Produto {
  variacoes_estoque: VariacaoEstoque[]
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/* ─── Product Grid Modal ────────────────────────────────── */
function ProdutoGridModal({
  produtos,
  onSelect,
  onClose,
}: {
  produtos: ProdutoComVariacoes[]
  onSelect: (p: ProdutoComVariacoes) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const filtered = produtos.filter(
    (p) =>
      p.status === "disponivel" &&
      p.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "min(760px, 96vw)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #EDE8EA",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1C1917" }}>
              Selecionar produto
            </div>
            <div style={{ color: "#A8A29E", fontSize: 13, marginTop: 2 }}>
              {filtered.length} produto{filtered.length !== 1 ? "s" : ""}{" "}
              disponíveis
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#A8A29E",
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 24px", flexShrink: 0 }}>
          <input
            autoFocus
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #EDE8EA",
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Grid */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "0 24px 24px",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            alignContent: "start",
            gap: 14,
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                color: "#A8A29E",
                padding: "40px 0",
                fontSize: 14,
              }}
            >
              Nenhum produto encontrado
            </div>
          )}
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                background: "#fff",
                border: "1.5px solid #EDE8EA",
                borderRadius: 12,
                cursor: "pointer",
                overflow: "hidden",
                transition: "border-color .15s, box-shadow .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#F472B6"
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(244,114,182,0.15)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#EDE8EA"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              {/* Photo */}
              <div style={{ width: "100%", height: 160, background: "#F5F5F4", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.fotos?.[0] ? (
                  <img
                    src={p.fotos[0]}
                    alt={p.nome}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <span style={{ color: "#D6D3D1", fontSize: 32 }}>📷</span>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: "10px 12px 12px", background: "#fff" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1C1917", fontFamily: "inherit", lineHeight: 1.3 }}>
                  {p.nome}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Product Detail Modal ──────────────────────────────── */
function ProdutoDetailModal({
  produto,
  onAdd,
  onClose,
}: {
  produto: ProdutoComVariacoes
  onAdd: (item: ItemPedido) => void
  onClose: () => void
}) {
  const [fotoIdx, setFotoIdx] = useState(0)
  const [tamanhoSel, setTamanhoSel] = useState<string | null>(null)
  const [variacaoSel, setVariacaoSel] = useState<string | null>(null)
  const [quantidade, setQuantidade] = useState(1)

  const fotos = produto.fotos ?? []
  const variacoes = produto.variacoes_estoque ?? []

  function handleAdd() {
    if (!tamanhoSel) return
    onAdd({
      produto_id: produto.id,
      variacao_id: variacaoSel,
      nome: produto.nome,
      tamanho: tamanhoSel,
      quantidade,
      preco: produto.preco,
      foto: fotos[0] ?? "",
    })
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "min(560px, 96vw)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid #EDE8EA",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1C1917" }}>
            {produto.nome}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#A8A29E",
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Main photo */}
          <div style={{ width: "100%", height: 280, background: "#F5F5F4", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {fotos[fotoIdx] ? (
              <img
                src={fotos[fotoIdx]}
                alt={produto.nome}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <span style={{ color: "#D6D3D1", fontSize: 48 }}>📷</span>
            )}
          </div>

          {/* Thumbnails */}
          {fotos.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "12px 22px",
                overflowX: "auto",
              }}
            >
              {fotos.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setFotoIdx(i)}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    border:
                      i === fotoIdx
                        ? "2.5px solid #F472B6"
                        : "2px solid #EDE8EA",
                    padding: 0,
                    cursor: "pointer",
                    overflow: "hidden",
                    flexShrink: 0,
                    position: "relative",
                    background: "#F5F5F4",
                  }}
                >
                  <img
                    src={f}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Info */}
          <div style={{ padding: "0 22px 8px" }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 22,
                color: "#F472B6",
                marginBottom: 2,
              }}
            >
              {fmt(produto.preco)}
            </div>
            {produto.descricao && (
              <div
                style={{ color: "#78716C", fontSize: 13, marginBottom: 12 }}
              >
                {produto.descricao}
              </div>
            )}
          </div>

          {/* Sizes */}
          <div style={{ padding: "0 22px 16px" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 12,
                color: "#78716C",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: ".5px",
              }}
            >
              Tamanho
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {variacoes.length > 0
                ? variacoes.map((v) => {
                    const sem = v.quantidade_disponivel <= 0
                    const sel = tamanhoSel === v.tamanho
                    return (
                      <button
                        key={v.id}
                        disabled={sem}
                        onClick={() => {
                          setTamanhoSel(v.tamanho)
                          setVariacaoSel(v.id)
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: sel
                            ? "2px solid #F472B6"
                            : sem
                            ? "1.5px solid #EDE8EA"
                            : "1.5px solid #D6D3D1",
                          background: sel
                            ? "#FDF2F8"
                            : sem
                            ? "#FAFAF9"
                            : "#fff",
                          color: sel
                            ? "#F472B6"
                            : sem
                            ? "#D6D3D1"
                            : "#1C1917",
                          fontFamily: "inherit",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: sem ? "not-allowed" : "pointer",
                          opacity: sem ? 0.5 : 1,
                        }}
                      >
                        {v.tamanho}
                        {sem && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#A8A29E",
                              display: "block",
                            }}
                          >
                            sem estoque
                          </span>
                        )}
                      </button>
                    )
                  })
                : /* no stock data — show free-text option */
                  ["RN","P","M","G","1","2","3","4","6","8","10","12","14","16"].map(
                    (t) => {
                      const sel = tamanhoSel === t
                      return (
                        <button
                          key={t}
                          onClick={() => {
                            setTamanhoSel(t)
                            setVariacaoSel(null)
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: sel
                              ? "2px solid #F472B6"
                              : "1.5px solid #D6D3D1",
                            background: sel ? "#FDF2F8" : "#fff",
                            color: sel ? "#F472B6" : "#1C1917",
                            fontFamily: "inherit",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          {t}
                        </button>
                      )
                    }
                  )}
            </div>
          </div>

          {/* Quantity */}
          <div style={{ padding: "0 22px 20px" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 12,
                color: "#78716C",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: ".5px",
              }}
            >
              Quantidade
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1.5px solid #EDE8EA",
                  background: "#fff",
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#78716C",
                }}
              >
                −
              </button>
              <span
                style={{ fontWeight: 800, fontSize: 18, color: "#1C1917", minWidth: 24, textAlign: "center" }}
              >
                {quantidade}
              </span>
              <button
                onClick={() => setQuantidade((q) => q + 1)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1.5px solid #EDE8EA",
                  background: "#fff",
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#78716C",
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 22px",
            borderTop: "1px solid #EDE8EA",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #EDE8EA",
              background: "#fff",
              color: "#78716C",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={!tamanhoSel}
            style={{
              flex: 2,
              padding: "12px",
              borderRadius: 8,
              border: "none",
              background: tamanhoSel ? "#1C1917" : "#E5E0DC",
              color: tamanhoSel ? "#fff" : "#A8A29E",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: 14,
              cursor: tamanhoSel ? "pointer" : "not-allowed",
            }}
          >
            Adicionar ao pedido
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Form ─────────────────────────────────────────── */
export function NovoPedidoForm({
  produtos,
}: {
  produtos: ProdutoComVariacoes[]
}) {
  const router = useRouter()

  // Customer
  const [clienteQuery, setClienteQuery] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [manualNome, setManualNome] = useState("")
  const [manualSobrenome, setManualSobrenome] = useState("")
  const [manualTelefone, setManualTelefone] = useState("")

  // Items
  const [items, setItems] = useState<ItemPedido[]>([])
  const [showGrid, setShowGrid] = useState(false)
  const [prodDetail, setProdDetail] = useState<ProdutoComVariacoes | null>(null)

  // Misc
  const [nota, setNota] = useState("")
  const [tipo, setTipo] = useState<"normal" | "confianca">("normal")
  const [salvando, setSalvando] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Search customers
  useEffect(() => {
    if (clienteQuery.length < 2) {
      setClientes([])
      setShowDropdown(false)
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(
        `/api/customers?q=${encodeURIComponent(clienteQuery)}`
      )
      if (res.ok) {
        const data = await res.json()
        setClientes(data)
        setShowDropdown(true)
      }
    }, 300)
  }, [clienteQuery])

  const total = items.reduce((s, i) => s + i.preco * i.quantidade, 0)

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx))
  }

  function setQty(idx: number, qty: number) {
    setItems((p) =>
      p.map((it, i) => (i === idx ? { ...it, quantidade: Math.max(1, qty) } : it))
    )
  }

  async function salvar() {
    const nome = clienteSel
      ? clienteSel.nome
      : `${manualNome.trim()} ${manualSobrenome.trim()}`.trim()
    const telefone = clienteSel ? clienteSel.telefone : manualTelefone.trim()

    if (!nome) return alert("Informe o nome do cliente")
    if (!telefone) return alert("Informe o telefone do cliente")
    if (items.length === 0) return alert("Adicione pelo menos 1 item")

    setSalvando(true)
    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_nome: nome,
        cliente_telefone: telefone,
        items: items.map((it) => ({
          produto_id: it.produto_id,
          variacao_id: it.variacao_id,
          nome: it.nome,
          tamanho: it.tamanho,
          quantidade: it.quantidade,
          preco: it.preco,
        })),
        total,
        tipo,
        nota: nota.trim() || null,
      }),
    })
    setSalvando(false)
    if (res.ok) {
      router.push("/admin/pedidos")
    } else {
      const e = await res.json()
      alert(e.error ?? "Erro ao salvar pedido")
    }
  }

  const nomeCliente = clienteSel
    ? clienteSel.nome
    : manualNome || manualSobrenome
    ? `${manualNome} ${manualSobrenome}`.trim()
    : null

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 760,
        }}
      >
        {/* ── Cliente ── */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #EDE8EA",
            borderRadius: 12,
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: "#1C1917",
              marginBottom: 16,
            }}
          >
            Cliente
          </div>

          {clienteSel ? (
            /* Selected customer chip */
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#F0FDF4",
                border: "1.5px solid #BBF7D0",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#15803D",
                  }}
                >
                  {clienteSel.nome}
                </div>
                <div style={{ fontSize: 12, color: "#4ADE80", marginTop: 2 }}>
                  {clienteSel.telefone}
                </div>
              </div>
              <button
                onClick={() => {
                  setClienteSel(null)
                  setClienteQuery("")
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#4ADE80",
                  fontSize: 18,
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Search existing */}
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#78716C",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                  }}
                >
                  Buscar cliente cadastrado
                </label>
                <input
                  placeholder="Nome ou telefone..."
                  value={clienteQuery}
                  onChange={(e) => setClienteQuery(e.target.value)}
                  onFocus={() => clientes.length > 0 && setShowDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowDropdown(false), 150)
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #EDE8EA",
                    borderRadius: 8,
                    fontFamily: "inherit",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {showDropdown && clientes.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #EDE8EA",
                      borderRadius: 8,
                      zIndex: 50,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      overflow: "hidden",
                    }}
                  >
                    {clientes.map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={() => {
                          setClienteSel(c)
                          setClienteQuery("")
                          setShowDropdown(false)
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "inherit",
                          borderBottom: "1px solid #F5F5F4",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#FFF1F8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "#1C1917",
                          }}
                        >
                          {c.nome}
                        </div>
                        <div style={{ fontSize: 12, color: "#A8A29E" }}>
                          {c.telefone}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "#A8A29E",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <div style={{ flex: 1, height: 1, background: "#EDE8EA" }} />
                ou preencha manualmente
                <div style={{ flex: 1, height: 1, background: "#EDE8EA" }} />
              </div>

              {/* Manual fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#78716C",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: ".5px",
                    }}
                  >
                    Nome
                  </label>
                  <input
                    placeholder="Nome"
                    value={manualNome}
                    onChange={(e) => setManualNome(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid #EDE8EA",
                      borderRadius: 8,
                      fontFamily: "inherit",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#78716C",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: ".5px",
                    }}
                  >
                    Sobrenome
                  </label>
                  <input
                    placeholder="Sobrenome"
                    value={manualSobrenome}
                    onChange={(e) => setManualSobrenome(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid #EDE8EA",
                      borderRadius: 8,
                      fontFamily: "inherit",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#78716C",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                  }}
                >
                  Telefone / WhatsApp
                </label>
                <input
                  placeholder="(11) 99999-9999"
                  value={manualTelefone}
                  onChange={(e) => setManualTelefone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #EDE8EA",
                    borderRadius: 8,
                    fontFamily: "inherit",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Tipo ── */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #EDE8EA",
            borderRadius: 12,
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: "#1C1917",
              marginBottom: 16,
            }}
          >
            Tipo de pedido
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {(["normal", "confianca"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border:
                    tipo === t
                      ? t === "normal"
                        ? "2px solid #1C1917"
                        : "2px solid #7C3AED"
                      : "1.5px solid #EDE8EA",
                  background:
                    tipo === t
                      ? t === "normal"
                        ? "#1C1917"
                        : "#F3E8FF"
                      : "#fff",
                  color:
                    tipo === t
                      ? t === "normal"
                        ? "#fff"
                        : "#6D28D9"
                      : "#78716C",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t === "normal" ? "Normal" : "Confiança"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Itens ── */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #EDE8EA",
            borderRadius: 12,
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1C1917" }}>
              Itens{" "}
              {items.length > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    color: "#A8A29E",
                    fontWeight: 600,
                  }}
                >
                  ({items.length})
                </span>
              )}
            </div>
            <button
              onClick={() => setShowGrid(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                background: "#F472B6",
                color: "#fff",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Adicionar
              item
            </button>
          </div>

          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#A8A29E",
                fontSize: 14,
                border: "1.5px dashed #EDE8EA",
                borderRadius: 10,
              }}
            >
              Nenhum item adicionado. Clique em "+ Adicionar item" para escolher
              produtos.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    border: "1px solid #EDE8EA",
                    borderRadius: 10,
                    background: "#FAFAF9",
                  }}
                >
                  {/* Photo */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 8,
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#F5F5F4",
                      position: "relative",
                    }}
                  >
                    {it.foto ? (
                      <img
                        src={it.foto}
                        alt={it.nome}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 8 }}
                      />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#D6D3D1", fontSize: 20 }}>
                        📷
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#1C1917",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {it.nome}
                    </div>
                    <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>
                      Tamanho: <strong style={{ color: "#78716C" }}>{it.tamanho}</strong>
                      {" · "}
                      {fmt(it.preco)} cada
                    </div>
                  </div>
                  {/* Qty */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={() => setQty(idx, it.quantidade - 1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: "1px solid #EDE8EA",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#78716C",
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 14,
                        color: "#1C1917",
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {it.quantidade}
                    </span>
                    <button
                      onClick={() => setQty(idx, it.quantidade + 1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: "1px solid #EDE8EA",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#78716C",
                      }}
                    >
                      +
                    </button>
                  </div>
                  {/* Subtotal */}
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      color: "#1C1917",
                      minWidth: 80,
                      textAlign: "right",
                    }}
                  >
                    {fmt(it.preco * it.quantidade)}
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#A8A29E",
                      fontSize: 18,
                      padding: 4,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid #EDE8EA",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "#78716C", fontWeight: 600, fontSize: 14 }}>
                Total:
              </span>
              <span
                style={{ fontWeight: 900, fontSize: 20, color: "#1C1917" }}
              >
                {fmt(total)}
              </span>
            </div>
          )}
        </div>

        {/* ── Nota ── */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #EDE8EA",
            borderRadius: 12,
            padding: "22px 24px",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: 800,
              fontSize: 15,
              color: "#1C1917",
              marginBottom: 10,
            }}
          >
            Nota (opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Observações sobre o pedido..."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #EDE8EA",
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: 14,
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              color: "#1C1917",
            }}
          />
        </div>

        {/* ── Actions ── */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            paddingBottom: 32,
          }}
        >
          <button
            onClick={() => router.push("/admin/pedidos")}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "1px solid #EDE8EA",
              background: "#fff",
              color: "#78716C",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            style={{
              padding: "12px 28px",
              borderRadius: 8,
              border: "none",
              background: salvando ? "#E5E0DC" : "#1C1917",
              color: salvando ? "#A8A29E" : "#fff",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: 14,
              cursor: salvando ? "not-allowed" : "pointer",
            }}
          >
            {salvando ? "Salvando..." : "Registrar pedido"}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showGrid && (
        <ProdutoGridModal
          produtos={produtos}
          onSelect={(p) => {
            setProdDetail(p)
            setShowGrid(false)
          }}
          onClose={() => setShowGrid(false)}
        />
      )}

      {prodDetail && (
        <ProdutoDetailModal
          produto={prodDetail}
          onAdd={(item) => setItems((prev) => [...prev, item])}
          onClose={() => setProdDetail(null)}
        />
      )}
    </>
  )
}
