/**
 * In-memory rate limiter simples.
 * Funciona para deployments single-instance (Vercel / VPS único).
 * Para multi-instance, substituir por Redis (Upstash).
 */
interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>()

// Limpa entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60_000)

/**
 * @returns true se permitido, false se bloqueado
 */
export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false

  entry.count++
  return true
}

/** Retorna IP do request de forma segura */
export function getIP(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for")
  return forwarded ? forwarded.split(",")[0].trim() : "unknown"
}
