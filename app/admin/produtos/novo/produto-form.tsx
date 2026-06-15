"use client"

import { useRef, useState, type DragEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { ImagePlus, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ESTACOES,
  FAIXAS_ETARIAS,
  GENEROS,
  STATUS_PRODUTO,
  TAMANHOS_DISPONIVEIS,
  type Estacao,
  type Genero,
  type StatusProduto,
} from "@/lib/types"

interface ImagemSelecionada {
  id: string
  arquivo: File
  preview: string
}

export function ProdutoForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [preco, setPreco] = useState("")
  const [genero, setGenero] = useState<Genero | "">("")
  const [faixaEtaria, setFaixaEtaria] = useState("")
  const [estacao, setEstacao] = useState<Estacao | "">("")
  const [colecao, setColecao] = useState("")
  const [status, setStatus] = useState<StatusProduto>("disponivel")

  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<Record<string, string>>({})
  const [imagens, setImagens] = useState<ImagemSelecionada[]>([])
  const [arrastando, setArrastando] = useState(false)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function adicionarArquivos(arquivos: FileList | File[]) {
    const novas: ImagemSelecionada[] = Array.from(arquivos)
      .filter((arquivo) => arquivo.type.startsWith("image/"))
      .map((arquivo) => ({
        id: `${arquivo.name}-${arquivo.lastModified}-${Math.random().toString(36).slice(2)}`,
        arquivo,
        preview: URL.createObjectURL(arquivo),
      }))

    if (novas.length === 0) return
    setImagens((atual) => [...atual, ...novas])
  }

  function removerImagem(id: string) {
    setImagens((atual) => {
      const alvo = atual.find((imagem) => imagem.id === id)
      if (alvo) URL.revokeObjectURL(alvo.preview)
      return atual.filter((imagem) => imagem.id !== id)
    })
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setArrastando(false)
    if (event.dataTransfer.files?.length) {
      adicionarArquivos(event.dataTransfer.files)
    }
  }

  function toggleTamanho(tamanho: string, marcado: boolean) {
    setTamanhosSelecionados((atual) => {
      const proximo = { ...atual }
      if (marcado) {
        proximo[tamanho] = proximo[tamanho] ?? "1"
      } else {
        delete proximo[tamanho]
      }
      return proximo
    })
  }

  function atualizarQuantidade(tamanho: string, quantidade: string) {
    setTamanhosSelecionados((atual) => ({ ...atual, [tamanho]: quantidade }))
  }

  function resetar() {
    imagens.forEach((imagem) => URL.revokeObjectURL(imagem.preview))
    setNome("")
    setDescricao("")
    setPreco("")
    setGenero("")
    setFaixaEtaria("")
    setEstacao("")
    setColecao("")
    setStatus("disponivel")
    setTamanhosSelecionados({})
    setImagens([])
    setErro(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)

    if (!genero || !faixaEtaria) {
      setErro("Preencha gênero e faixa etária.")
      return
    }

    const tamanhos = Object.entries(tamanhosSelecionados)
    if (tamanhos.length === 0) {
      setErro("Selecione ao menos um tamanho com quantidade.")
      return
    }

    const precoNumerico = Number(preco.replace(",", "."))
    if (!preco || Number.isNaN(precoNumerico)) {
      setErro("Informe um preço válido.")
      return
    }

    setSalvando(true)

    try {
      // 1. Upload das fotos
      const urlsFotos: string[] = []
      for (const imagem of imagens) {
        const fd = new FormData()
        fd.append("file", imagem.arquivo)
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(`Falha ao enviar imagem "${imagem.arquivo.name}": ${json.error ?? res.statusText}`)
        urlsFotos.push(json.url)
      }

      // 2. Inserir produto + variações
      const variacoes = tamanhos.map(([tamanho, quantidade]) => ({
        tamanho,
        quantidade: Math.max(0, Number(quantidade) || 0),
      }))

      const res = await fetch("/api/admin/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          descricao: descricao || null,
          preco: precoNumerico,
          genero,
          faixa_etaria: faixaEtaria,
          colecao: colecao || null,
          estacao: estacao || null,
          status,
          fotos: urlsFotos,
          variacoes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Não foi possível criar o produto.")

      toast.success("Produto cadastrado com sucesso!")
      resetar()
      router.push("/admin/produtos")
      router.refresh()
    } catch (excecao) {
      const mensagem = excecao instanceof Error ? excecao.message : "Erro inesperado ao salvar o produto."
      setErro(mensagem)
      toast.error(mensagem)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="nome">Nome do produto</Label>
              <Input
                id="nome"
                required
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex.: Conjunto moletom unicórnio"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Detalhes sobre o tecido, modelagem, cuidados etc."
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                value={preco}
                onChange={(event) => setPreco(event.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as StatusProduto)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_PRODUTO.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Gênero</Label>
              <Select value={genero} onValueChange={(value) => setGenero(value as Genero)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {GENEROS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Faixa etária</Label>
              <Select value={faixaEtaria} onValueChange={setFaixaEtaria}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FAIXAS_ETARIAS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Estação</Label>
              <Select value={estacao} onValueChange={(value) => setEstacao(value as Estacao)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESTACOES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="colecao">Coleção</Label>
              <Input
                id="colecao"
                value={colecao}
                onChange={(event) => setColecao(event.target.value)}
                placeholder="Ex.: Verão Encantado 2026"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Variações de tamanho</h2>
            <p className="text-muted-foreground text-sm">
              Marque os tamanhos disponíveis e informe a quantidade de cada um.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {TAMANHOS_DISPONIVEIS.map((tamanho) => {
              const marcado = tamanho in tamanhosSelecionados
              return (
                <div
                  key={tamanho}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2",
                    marcado && "border-primary bg-primary/5"
                  )}
                >
                  <Checkbox
                    id={`tamanho-${tamanho}`}
                    checked={marcado}
                    onCheckedChange={(valor) => toggleTamanho(tamanho, valor === true)}
                  />
                  <Label htmlFor={`tamanho-${tamanho}`} className="flex-1 font-normal">
                    {tamanho}
                  </Label>
                  {marcado && (
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="h-8 w-16 px-2 text-center"
                      value={tamanhosSelecionados[tamanho]}
                      onChange={(event) => atualizarQuantidade(tamanho, event.target.value)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Fotos do produto</h2>
            <p className="text-muted-foreground text-sm">
              Arraste imagens para a área abaixo ou clique para selecionar. Elas serão enviadas para o Storage.
            </p>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault()
              setArrastando(true)
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              arrastando ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
            )}
          >
            <ImagePlus className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">Arraste e solte as imagens aqui</p>
            <p className="text-muted-foreground text-xs">ou clique para escolher arquivos (PNG, JPG, WEBP)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) adicionarArquivos(event.target.files)
                event.target.value = ""
              }}
            />
          </div>

          {imagens.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imagens.map((imagem) => (
                <div key={imagem.id} className="group relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={imagem.preview}
                    alt={imagem.arquivo.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      removerImagem(imagem.id)
                    }}
                    className="bg-background/90 text-foreground absolute top-1.5 right-1.5 rounded-full p-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
                    aria-label="Remover imagem"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {erro && (
        <p className="text-destructive text-sm" role="alert">
          {erro}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/produtos")} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando && <Loader2 className="size-4 animate-spin" />}
          {salvando ? "Salvando..." : "Salvar produto"}
        </Button>
      </div>
    </form>
  )
}
