// Roda com: node scripts/seed-fotos.mjs
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "http://127.0.0.1:54321",
  "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz"
)

const produtos = [
  { id: "a1000001-0000-0000-0000-000000000001", seed: "vestido-floral" },
  { id: "a1000001-0000-0000-0000-000000000002", seed: "conjunto-saia" },
  { id: "a1000001-0000-0000-0000-000000000003", seed: "legging-borboleta" },
  { id: "a1000001-0000-0000-0000-000000000004", seed: "vestido-inverno" },
  { id: "a1000001-0000-0000-0000-000000000005", seed: "sainha-jeans" },
  { id: "a1000001-0000-0000-0000-000000000006", seed: "blusao-rosa" },
  { id: "a1000001-0000-0000-0000-000000000007", seed: "vestido-tiedye" },
  { id: "a1000001-0000-0000-0000-000000000008", seed: "conjunto-pelucia" },
  { id: "b2000001-0000-0000-0000-000000000001", seed: "camiseta-bermuda" },
  { id: "b2000001-0000-0000-0000-000000000002", seed: "calca-moletom" },
  { id: "b2000001-0000-0000-0000-000000000003", seed: "camisa-social" },
  { id: "b2000001-0000-0000-0000-000000000004", seed: "conjunto-jeans" },
  { id: "b2000001-0000-0000-0000-000000000005", seed: "jaqueta-vento" },
  { id: "b2000001-0000-0000-0000-000000000006", seed: "short-praia" },
  { id: "c3000001-0000-0000-0000-000000000001", seed: "body-branco" },
  { id: "c3000001-0000-0000-0000-000000000002", seed: "macacao-listrado" },
  { id: "c3000001-0000-0000-0000-000000000003", seed: "pijama-estrelas" },
  { id: "c3000001-0000-0000-0000-000000000004", seed: "body-cinza" },
  { id: "c3000001-0000-0000-0000-000000000005", seed: "macacao-plush" },
]

let ok = 0, err = 0
for (const p of produtos) {
  const fotos = [1, 2, 3].map(
    (n) => `https://picsum.photos/seed/${p.seed}-${n}/600/750`
  )
  const { error } = await supabase
    .from("produtos")
    .update({ fotos })
    .eq("id", p.id)

  if (error) {
    console.error(`ERRO ${p.seed}: ${error.message}`)
    err++
  } else {
    console.log(`OK ${p.seed}`)
    ok++
  }
}

console.log(`\nPronto: ${ok} atualizados, ${err} erros`)
