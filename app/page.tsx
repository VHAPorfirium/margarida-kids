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
    <div style={{ minHeight: "100vh", background: "#FAFAF9", fontFamily: "var(--font-nunito, Nunito, sans-serif)" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #EDE8EA", padding: "24px 20px 20px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <div style={{ width: 110, height: 3, borderRadius: 2, background: "linear-gradient(90deg,#93C5FD,#6EE7B7,#FBBF24,#F472B6)" }} />
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917", letterSpacing: "-0.3px", margin: 0 }}>Margarida Kids</h1>
        </div>
        <p style={{ color: "#A8A29E", fontSize: 13, fontWeight: 600, margin: 0 }}>
          Roupinhas para cada fase da sua criança
        </p>
      </header>

      <CatalogoClient produtos={produtos} />
    </div>
  )
}
