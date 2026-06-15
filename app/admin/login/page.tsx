"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setLoading(true)
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    })
    setLoading(false)
    if (!res.ok) {
      const json = await res.json()
      setErro(json.error ?? "Email ou senha inválidos")
      return
    }
    router.push("/admin")
    router.refresh()
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-nunito, Nunito, sans-serif)" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1C1917", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917", marginBottom: 6 }}>Admin</h1>
          <p style={{ fontSize: 13, color: "#78716C" }}>Acesso restrito à equipe Margarida Kids</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@exemplo.com" autoComplete="email" required
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", border: "1px solid #EDE8EA", borderRadius: 8, fontFamily: "inherit", fontSize: 14, color: "#1C1917", background: "#fff", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Senha</label>
            <input
              type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" required
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", border: "1px solid #EDE8EA", borderRadius: 8, fontFamily: "inherit", fontSize: 14, color: "#1C1917", background: "#fff", outline: "none" }}
            />
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
              {erro}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ marginTop: 4, padding: "13px", background: loading ? "#78716C" : "#1C1917", color: "#fff", border: "none", borderRadius: 8, fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
