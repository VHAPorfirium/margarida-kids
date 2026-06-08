"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ESTACOES, GENEROS, type ProdutoComVariacoes } from "@/lib/types"
import { ProdutoModal } from "./produto-modal"

const TODOS = "todos"

export function CatalogoClient({ produtos }: { produtos: ProdutoComVariacoes[] }) {
  const [genero, setGenero] = useState(TODOS)
  const [estacao, setEstacao] = useState(TODOS)
  const [colecao, setColecao] = useState(TODOS)
  const [tamanho, setTamanho] = useState(TODOS)
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoComVariacoes | null>(null)

  const colecoes = useMemo(() => {
    const conjunto = new Set<string>()
    produtos.forEach((produto) => {
      if (produto.colecao) conjunto.add(produto.colecao)
    })
    return Array.from(conjunto).sort()
  }, [produtos])

  const tamanhosComEstoque = useMemo(() => {
    const conjunto = new Set<string>()
    produtos.forEach((produto) => {
      produto.variacoes_estoque
        .filter((variacao) => variacao.quantidade_disponivel > 0)
        .forEach((variacao) => conjunto.add(variacao.tamanho))
    })
    return Array.from(conjunto)
  }, [produtos])

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      if (genero !== TODOS && produto.genero !== genero) return false
      if (estacao !== TODOS && produto.estacao !== estacao) return false
      if (colecao !== TODOS && produto.colecao !== colecao) return false
      if (tamanho !== TODOS) {
        const temTamanho = produto.variacoes_estoque.some(
          (variacao) => variacao.tamanho === tamanho && variacao.quantidade_disponivel > 0
        )
        if (!temTamanho) return false
      }
      return true
    })
  }, [produtos, genero, estacao, colecao, tamanho])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4 dark:bg-zinc-950">
        <FiltroSelect
          label="Gênero"
          value={genero}
          onChange={setGenero}
          opcoes={GENEROS.map((item) => ({ value: item.value, label: item.label }))}
        />
        <FiltroSelect
          label="Estação"
          value={estacao}
          onChange={setEstacao}
          opcoes={ESTACOES.map((item) => ({ value: item.value, label: item.label }))}
        />
        <FiltroSelect
          label="Coleção"
          value={colecao}
          onChange={setColecao}
          opcoes={colecoes.map((item) => ({ value: item, label: item }))}
        />
        <FiltroSelect
          label="Tamanho"
          value={tamanho}
          onChange={setTamanho}
          opcoes={tamanhosComEstoque.map((item) => ({ value: item, label: item }))}
        />
      </div>

      {produtosFiltrados.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          Nenhum produto encontrado com os filtros selecionados.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {produtosFiltrados.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onClick={() => setProdutoSelecionado(produto)}
            />
          ))}
        </div>
      )}

      <ProdutoModal
        produto={produtoSelecionado}
        aberto={produtoSelecionado !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setProdutoSelecionado(null)
        }}
      />
    </div>
  )
}

function FiltroSelect({
  label,
  value,
  onChange,
  opcoes,
}: {
  label: string
  value: string
  onChange: (valor: string) => void
  opcoes: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-[160px] capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value} className="capitalize">
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ProdutoCard({
  produto,
  onClick,
}: {
  produto: ProdutoComVariacoes
  onClick: () => void
}) {
  const tamanhosDisponiveis = produto.variacoes_estoque.filter((v) => v.quantidade_disponivel > 0)
  const ultimasUnidades = tamanhosDisponiveis.some((v) => v.quantidade_disponivel <= 2)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-shadow hover:shadow-md dark:bg-zinc-950"
    >
      <div className="bg-muted relative aspect-square overflow-hidden">
        {produto.fotos?.[0] ? (
          <Image
            src={produto.fotos[0]}
            alt={produto.nome}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <ImageOff className="size-8" />
          </div>
        )}
        {ultimasUnidades && (
          <Badge variant="destructive" className="absolute top-2 left-2">
            Últimas unidades
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-medium leading-snug">{produto.nome}</h3>
        <p className="text-lg font-semibold">
          {produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
        {tamanhosDisponiveis.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {tamanhosDisponiveis.map((variacao) => (
              <Badge key={variacao.id} variant="outline">
                {variacao.tamanho}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
