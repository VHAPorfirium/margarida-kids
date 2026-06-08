import Image from "next/image"
import Link from "next/link"
import { Plus, ImageOff } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Produto, StatusProduto } from "@/lib/types"
import { StatusSelect } from "./status-select"

const STATUS_BADGE: Record<StatusProduto, { label: string; variant: "success" | "destructive" | "secondary" }> = {
  disponivel: { label: "Disponível", variant: "success" },
  esgotado: { label: "Esgotado", variant: "destructive" },
  inativo: { label: "Inativo", variant: "secondary" },
}

export default async function ProdutosPage() {
  const supabase = await createClient()

  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("*")
    .order("criado_em", { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie o catálogo de produtos da loja.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <Plus className="size-4" />
            Novo produto
          </Link>
        </Button>
      </div>

      {error && (
        <p className="text-destructive text-sm">
          Não foi possível carregar os produtos: {error.message}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Gênero</TableHead>
              <TableHead>Estação</TableHead>
              <TableHead>Coleção</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(produtos as Produto[] | null)?.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell>
                  {produto.fotos?.[0] ? (
                    <Image
                      src={produto.fotos[0]}
                      alt={produto.nome}
                      width={48}
                      height={48}
                      className="size-12 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-md border">
                      <ImageOff className="size-4" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{produto.nome}</TableCell>
                <TableCell className="capitalize">{produto.genero}</TableCell>
                <TableCell className="capitalize">{produto.estacao ?? "—"}</TableCell>
                <TableCell>{produto.colecao ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[produto.status].variant}>
                    {STATUS_BADGE[produto.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <StatusSelect produtoId={produto.id} statusAtual={produto.status} />
                </TableCell>
              </TableRow>
            ))}

            {produtos?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                  Nenhum produto cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
