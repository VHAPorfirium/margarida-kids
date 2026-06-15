export const ADMIN_COOKIE = "admin_session"
const MAX_AGE_MS = 60 * 60 * 24 * 1000

const SECRET = process.env.ADMIN_SESSION_SECRET ?? "dev-secret-change-in-prod"

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function sign(ts: number): Promise<string> {
  const key = await getKey()
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`admin:${ts}`))
  return bufToHex(sig)
}

export async function createAdminToken(): Promise<string> {
  const ts = Date.now()
  const sig = await sign(ts)
  return `${ts}:${sig}`
}

export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const parts = token.split(":")
  if (parts.length !== 2) return false
  const [tsStr, sig] = parts
  const ts = parseInt(tsStr, 10)
  if (isNaN(ts)) return false
  if (Date.now() - ts > MAX_AGE_MS) return false
  const expected = await sign(ts)
  if (expected.length !== sig.length) return false
  // timing-safe compare
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}
