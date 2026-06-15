"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_PRODUTO, type StatusProduto } from "@/lib/types"

export function StatusSelect({
  produtoId,
  statusAtual,
}: {
  produtoId: string
  statusAtual: StatusProduto
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<StatusProduto>(statusAtual)

  async function handleChange(novoStatus: StatusProduto) {
    const statusAnterior = status
    setStatus(novoStatus)

    const r = await fetch("/api/admin/produtos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: produtoId, status: novoStatus }) })
    const { error } = r.ok ? { error: null } : { error: true }

    if (error) {
      setStatus(statusAnterior)
      toast.error("Não foi possível atualizar o status.")
      return
    }

    toast.success("Status atualizado.")
    startTransition(() => router.refresh())
  }

  return (
    <Select value={status} onValueChange={(value) => handleChange(value as StatusProduto)} disabled={isPending}>
      <SelectTrigger size="sm" className="w-[140px]">
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
  )
}
