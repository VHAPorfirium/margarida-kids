import { createHash, randomBytes } from "crypto"
import { createClient } from "@supabase/supabase-js"

const EXPIRY_MINUTES = 30

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Gera token, salva hash no banco, retorna o token limpo (para o e-mail) */
export async function gerarResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const tokenHash = createHash("sha256").update(token).digest("hex")

  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000)

  const supabase = serviceClient()

  // Invalida tokens anteriores do mesmo e-mail
  await supabase
    .from("password_reset_tokens")
    .update({ usado_em: new Date().toISOString() })
    .eq("email", email)
    .is("usado_em", null)

  const { error } = await supabase.from("password_reset_tokens").insert({
    email,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw new Error("Erro ao criar token de reset")
  return token
}

/** Valida token, retorna e-mail se válido, null se inválido/expirado */
export async function validarResetToken(token: string): Promise<string | null> {
  const tokenHash = createHash("sha256").update(token).digest("hex")
  const supabase = serviceClient()

  const { data } = await supabase
    .from("password_reset_tokens")
    .select("email, expires_at, usado_em")
    .eq("token_hash", tokenHash)
    .single()

  if (!data) return null
  if (data.usado_em) return null
  if (new Date(data.expires_at) < new Date()) return null

  return data.email
}

/** Marca token como usado */
export async function consumirResetToken(token: string): Promise<void> {
  const tokenHash = createHash("sha256").update(token).digest("hex")
  const supabase = serviceClient()
  await supabase
    .from("password_reset_tokens")
    .update({ usado_em: new Date().toISOString() })
    .eq("token_hash", tokenHash)
}
