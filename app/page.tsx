import { createClient } from "@/lib/supabase/server"
import type { ProdutoComVariacoes } from "@/lib/types"
import { CatalogoClient } from "./catalogo-client"

export default async function CatalogoPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("produtos")
    .select("*, variacoes_estoque(*)")
    .eq("status", "disponivel")
    .order("criado_em", { ascending: false })

  const produtos = (data ?? []) as ProdutoComVariacoes[]

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex flex-col items-center gap-1 border-b bg-white px-4 py-10 text-center dark:bg-zinc-950">
        <h1 className="text-3xl font-semibold tracking-tight">Margarida Kids</h1>
        <p className="text-muted-foreground text-sm">
          Roupas infantis com carinho, do bebê ao adolescente — 0 a 18 anos.
        </p>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
        <CatalogoClient produtos={produtos} />
      </main>
    </div>
  )
}
