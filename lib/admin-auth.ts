import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-session"

export async function requireAdmin(): Promise<{ ok: true } | { ok: false; response: Response }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value

  if (!(await verifyAdminToken(token))) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Nao autorizado" }, { status: 401 }),
    }
  }

  return { ok: true }
}
