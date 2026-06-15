"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ImageOff } from "lucide-react"
import type { Produto, StatusProduto } from "@/lib/types"
import { StatusSelect } from "./status-select"

const STATUS_META: Record<StatusProduto, { label: string; bg: string; color: string; dot: string }> = {
  disponivel: { label: "Disponível", bg: "#F0FDF4", color: "#16A34A", dot: "#22C55E" },
  esgotado:   { label: "Esgotado",   bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
  inativo:    { label: "Inativo",    bg: "#F5F5F4", color: "#78716C", dot: "#A8A29E" },
}

export function ProdutosTable({ lista }: { lista: Produto[] }) {
  const [search, setSearch] = useState("")

  const filtered = search.trim()
    ? lista.filter((p) => p.nome.toLowerCase().includes(search.trim().toLowerCase()))
    : lista

  return (
    <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
      {/* Header row */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid #EDE8EA", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Lista de produtos</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2.5" strokeLinecap="round" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: 28, paddingRight: search ? 28 : 10, paddingTop: 6, paddingBottom: 6,
                border: "1px solid #EDE8EA", borderRadius: 7,
                fontFamily: "inherit", fontSize: 13, color: "#1C1917",
                background: "#FAFAF9", outline: "none", width: 200,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, borderRadius: "50%", border: "none", background: "#E5E0DC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#78716C", fontFamily: "inherit" }}
              >✕</button>
            )}
          </div>
          <span style={{ fontSize: 12, color: "#A8A29E", fontWeight: 600, whiteSpace: "nowrap" }}>
            {filtered.length} {filtered.length === 1 ? "item" : "itens"}
          </span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
          <thead>
            <tr>
              {["Produto", "Gênero", "Estação", "Coleção", "Status", ""].map((h) => (
                <th key={h} style={{
                  textAlign: "left", padding: "10px 14px",
                  fontSize: 11, fontWeight: 700, color: "#A8A29E",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                  background: "#FAFAF9", borderBottom: "1px solid #EDE8EA",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((produto) => {
              const st = STATUS_META[produto.status]
              return (
                <tr key={produto.id}>
                  <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", fontSize: 13, verticalAlign: "middle" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {produto.fotos?.[0] ? (
                        <Image
                          src={produto.fotos[0]} alt={produto.nome}
                          width={38} height={38}
                          style={{ borderRadius: 8, border: "1px solid #EDE8EA", objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 38, height: 38, borderRadius: 8,
                          background: "#FDF2F8", border: "1px solid #EDE8EA",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <ImageOff size={14} color="#A8A29E" />
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{produto.nome}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", fontSize: 13, color: "#78716C", verticalAlign: "middle", textTransform: "capitalize" }}>
                    {produto.genero}
                  </td>
                  <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", fontSize: 13, color: "#78716C", verticalAlign: "middle", textTransform: "capitalize" }}>
                    {produto.estacao ?? "—"}
                  </td>
                  <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", fontSize: 13, color: "#78716C", verticalAlign: "middle" }}>
                    {produto.colecao ?? "—"}
                  </td>
                  <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", verticalAlign: "middle" }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: st.bg, borderRadius: 5, padding: "3px 10px",
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px", borderBottom: "1px solid #F5F0F2", verticalAlign: "middle" }}>
                    <StatusSelect produtoId={produto.id} statusAtual={produto.status} />
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "40px 14px", textAlign: "center", color: "#A8A29E", fontSize: 13 }}>
                  {search ? `Nenhum produto encontrado para "${search}".` : (
                    <>
                      Nenhum produto cadastrado.{" "}
                      <Link href="/admin/produtos/novo" style={{ color: "#F472B6", fontWeight: 700, textDecoration: "none" }}>
                        Cadastrar agora →
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
