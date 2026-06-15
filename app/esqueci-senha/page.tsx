"use client"
import { useState } from "react"
import Link from "next/link"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    const emailLimpo = email.trim().toLowerCase()
    if (!emailLimpo.includes("@")) return setErro("Informe um e-mail válido")

    setLoading(true)
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailLimpo }),
    })
    setLoading(false)

    if (res.ok) {
      setEnviado(true)
    } else {
      const json = await res.json()
      setErro(json.error ?? "Erro ao enviar")
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9", fontFamily: "var(--font-nunito, Nunito, sans-serif)" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #EDE8EA", padding: "14px 16px", display: "flex", justifyContent: "flex-end" }}>
        <Link href="/catalago" style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #F472B6", background: "#FDF2F8", color: "#F472B6", fontFamily: "inherit", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
          Ver catálogo
        </Link>
      </div>

      <div style={{ maxWidth: 400, margin: "0 auto", padding: "60px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔑</div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917", marginBottom: 6 }}>Esqueci minha senha</h1>
          <p style={{ fontSize: 13, color: "#78716C" }}>
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        {enviado ? (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "24px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📧</div>
            <p style={{ fontWeight: 800, fontSize: 15, color: "#16A34A", marginBottom: 6 }}>E-mail enviado!</p>
            <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.6, marginBottom: 20 }}>
              Se este e-mail estiver cadastrado, você receberá um link em instantes.
              Verifique também sua caixa de spam.
            </p>
            <p style={{ fontSize: 12, color: "#16A34A" }}>O link expira em 30 minutos.</p>
            <Link href="/login" style={{ display: "inline-block", marginTop: 20, color: "#F472B6", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              ← Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>
                E-mail cadastrado
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", border: "1px solid #EDE8EA", borderRadius: 8, fontFamily: "inherit", fontSize: 14, color: "#1C1917", background: "#FAFAF9", outline: "none" }}
              />
            </div>

            {erro && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ padding: "13px 0", borderRadius: 8, border: "none", background: loading ? "#A8A29E" : "#1C1917", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "#78716C", marginTop: 4 }}>
              Lembrou a senha?{" "}
              <Link href="/login" style={{ color: "#F472B6", fontWeight: 700, textDecoration: "none" }}>
                Fazer login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
