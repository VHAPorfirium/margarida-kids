import { scryptSync, randomBytes, timingSafeEqual } from "crypto"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const SESSION_COOKIE = "mk_session"
const SESSION_DAYS = 30

export function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(senha, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verificarSenha(senha: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":")
    const hashBuffer = Buffer.from(hash, "hex")
    const derivedHash = scryptSync(senha, salt, 64)
    return timingSafeEqual(hashBuffer, derivedHash)
  } catch {
    return false
  }
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function criarSessao(telefone: string): Promise<string> {
  const supabase = serviceClient()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS)

  const { data, error } = await supabase
    .from("customer_sessions")
    .insert({ telefone, expires_at: expiresAt.toISOString() })
    .select("id")
    .single()

  if (error || !data) throw new Error("Erro ao criar sessão")
  return data.id
}

export async function lerSessao(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const supabase = serviceClient()
  const { data } = await supabase
    .from("customer_sessions")
    .select("telefone, expires_at")
    .eq("id", token)
    .single()

  if (!data) return null
  if (new Date(data.expires_at) < new Date()) return null
  return data.telefone
}

export async function deletarSessao(token: string): Promise<void> {
  const supabase = serviceClient()
  await supabase.from("customer_sessions").delete().eq("id", token)
}

export { SESSION_COOKIE, SESSION_DAYS }
