import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { rateLimit, getIP } from "@/lib/rate-limit"

interface ItemInput {
  nome?: unknown
  tamanho?: unknown
  quantidade?: unknown
  qty?: unknown
  preco?: unknown
  foto?: unknown
}

function validarItem(it: unknown): it is ItemInput {
  if (!it || typeof it !== "object") return false
  const item = it as Record<string, unknown>
  if (typeof item.nome !== "string" || item.nome.trim().length === 0 || item.nome.length > 200) return false
  if (typeof item.tamanho !== "string" || item.tamanho.length === 0 || item.tamanho.length > 20) return false
  const qty = Number(item.quantidade ?? item.qty ?? 1)
  if (!Number.isInteger(qty) || qty < 1 || qty > 50) return false
  const preco = Number(item.preco ?? 0)
  if (isNaN(preco) || preco < 0 || preco > 99999) return false
  return true
}

export async function POST(req: Request) {
  try {
    // Rate limit: 10 pedidos por IP em 1 hora
    const ip = getIP(req)
    if (!rateLimit(`pedidos:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente mais tarde." },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
    }

    const { cliente_nome, cliente_telefone, items } = body as Record<string, unknown>

    if (typeof cliente_nome !== "string" || cliente_nome.trim().length === 0 || cliente_nome.length > 150) {
      return NextResponse.json({ error: "Nome inválido" }, { status: 400 })
    }
    if (typeof cliente_telefone !== "string") {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 })
    }
    const telefoneDigits = cliente_telefone.replace(/\D/g, "")
    if (telefoneDigits.length < 10 || telefoneDigits.length > 11) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      return NextResponse.json({ error: "Itens inválidos" }, { status: 400 })
    }

    for (const it of items) {
      if (!validarItem(it)) {
        return NextResponse.json({ error: "Item inválido" }, { status: 400 })
      }
    }

    // Calcular total server-side — ignora o total enviado pelo cliente
    const normalizedItems = items.map((it) => {
      const item = it as Record<string, unknown>
      const qty = Number(item.quantidade ?? item.qty ?? 1)
      const preco = Number(item.preco ?? 0)
      return {
        nome: String(item.nome).trim(),
        tamanho: String(item.tamanho).trim(),
        quantidade: qty,
        preco: parseFloat(preco.toFixed(2)),
        ...(item.foto ? { foto: String(item.foto).slice(0, 500) } : {}),
      }
    })

    const totalCalculado = parseFloat(
      normalizedItems.reduce((sum, it) => sum + it.preco * it.quantidade, 0).toFixed(2)
    )

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from("pedidos")
      .insert({
        cliente_nome: cliente_nome.trim(),
        cliente_telefone: telefoneDigits,
        items: normalizedItems,
        total: totalCalculado,
        status: "aguardando",
        tipo: "normal",
      })
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao criar pedido:", error)
      return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error("Erro inesperado:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
