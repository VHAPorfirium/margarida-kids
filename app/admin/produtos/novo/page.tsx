import { ProdutoForm } from "./produto-form"

export default function NovoProdutoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo produto</h1>
        <p className="text-muted-foreground text-sm">
          Cadastre um novo produto no catálogo da Margarida Kids.
        </p>
      </div>

      <ProdutoForm />
    </div>
  )
}
