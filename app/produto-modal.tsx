"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff, MessageCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ProdutoComVariacoes } from "@/lib/types"

export function ProdutoModal({
  produto,
  aberto,
  onOpenChange,
}: {
  produto: ProdutoComVariacoes | null
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {produto && <ProdutoModalConteudo key={produto.id} produto={produto} />}
      </DialogContent>
    </Dialog>
  )
}

function ProdutoModalConteudo({ produto }: { produto: ProdutoComVariacoes }) {
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<string | null>(null)

  const fotos = produto.fotos ?? []
  const tamanhosComEstoque = produto.variacoes_estoque.filter((v) => v.quantidade_disponivel > 0)

  const numeroWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

  function handleComprar() {
    if (!tamanhoSelecionado || !numeroWhatsapp) return

    const precoFormatado = produto.preco.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })

    const mensagem =
      `Olá Margarida! Tenho interesse em:\n` +
      `• ${produto.nome} — Tamanho ${tamanhoSelecionado} — ${precoFormatado}\n\n` +
      `Pode me ajudar? 😊`

    const url = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{produto.nome}</DialogTitle>
        <DialogDescription>
          {produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
            {fotos[fotoAtiva] ? (
              <Image src={fotos[fotoAtiva]} alt={produto.nome} fill className="object-cover" />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center">
                <ImageOff className="size-8" />
              </div>
            )}
          </div>
          {fotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {fotos.map((foto, indice) => (
                <button
                  key={foto}
                  type="button"
                  onClick={() => setFotoAtiva(indice)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-md border-2",
                    indice === fotoAtiva ? "border-primary" : "border-transparent"
                  )}
                >
                  <Image src={foto} alt={`${produto.nome} - foto ${indice + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {produto.descricao && (
            <p className="text-muted-foreground text-sm leading-relaxed">{produto.descricao}</p>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Tamanho</span>
            {tamanhosComEstoque.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem estoque disponível no momento.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {produto.variacoes_estoque.map((variacao) => {
                  const disponivel = variacao.quantidade_disponivel > 0
                  const selecionado = tamanhoSelecionado === variacao.tamanho

                  return (
                    <button
                      key={variacao.id}
                      type="button"
                      disabled={!disponivel}
                      onClick={() => setTamanhoSelecionado(variacao.tamanho)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                        !disponivel && "text-muted-foreground/50 cursor-not-allowed line-through",
                        disponivel && !selecionado && "hover:border-primary",
                        selecionado && "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {variacao.tamanho}
                    </button>
                  )
                })}
              </div>
            )}
            {tamanhosComEstoque.some((v) => v.quantidade_disponivel <= 2) && (
              <Badge variant="destructive" className="w-fit">
                Últimas unidades
              </Badge>
            )}
          </div>

          <Button
            type="button"
            className="mt-auto w-full"
            disabled={!tamanhoSelecionado || !numeroWhatsapp}
            onClick={handleComprar}
          >
            <MessageCircle className="size-4" />
            Comprar pelo WhatsApp
          </Button>
          {!numeroWhatsapp && (
            <p className="text-destructive text-xs">
              Configure NEXT_PUBLIC_WHATSAPP_NUMBER para habilitar a compra pelo WhatsApp.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
