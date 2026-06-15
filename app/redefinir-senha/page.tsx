"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

function EyeIcon({ open }: { open: boolean }) {
  return open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}

function RedefinirSenhaForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!token) setErro("Link inválido. Solicite um novo.")
  }, [token])

  const senhaForcaMsg = senha.length === 0 ? "" :
    senha.length < 8 ? "Mínimo 8 caracteres" :
    !/[A-Z]/.test(senha) ? "Precisa de letra maiúscula" :
    !/[0-9]/.test(senha) ? "Precisa de número" : ""
  const senhaOk = senha.length >= 8 && /[A-Z]/.test(senha) && /[0-9]/.test(senha)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!senhaOk) return setErro(senhaForcaMsg || "Senha inválida")
    if (senha !== confirmar) return setErro("As senhas não coincidem")

    setLoading(true)
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, senha }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) return setErro(json.error ?? "Erro ao redefinir senha")
    setSucesso(true)
    setTimeout(() => router.push("/login"), 3000)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "11px 14px",
    border: "1px solid #EDE8EA", borderRadius: 8, fontFamily: "inherit",
    fontSize: 14, color: "#1C1917", background: "#FAFAF9", outline: "none",
  }
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700, color: "#78716C",
    textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6,
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "60px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917", marginBottom: 6 }}>
          Nova senha
        </h1>
        <p style={{ fontSize: 13, color: "#78716C" }}>
          Escolha uma senha segura para sua conta.
        </p>
      </div>

      {sucesso ? (
        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "28px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <p style={{ fontWeight: 800, fontSize: 16, color: "#16A34A", marginBottom: 8 }}>Senha redefinida!</p>
          <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
            Sua senha foi alterada com sucesso.<br/>
            Redirecionando para o login...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nova senha */}
          <div>
            <label style={labelStyle}>Nova senha</label>
            <div style={{ position: "relative" }}>
              <input
                type={showSenha ? "text" : "password"}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={{ ...inputStyle, paddingRight: 42 }}
                disabled={!token}
              />
              <button type="button" onClick={() => setShowSenha(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A8A29E", padding: 0 }}>
                <EyeIcon open={showSenha} />
              </button>
            </div>
            {senhaForcaMsg && <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 5 }}>{senhaForcaMsg}</p>}
            {senhaOk && <p style={{ fontSize: 11, color: "#16A34A", marginTop: 5 }}>Senha válida ✓</p>}
          </div>

          {/* Confirmar senha */}
          <div>
            <label style={labelStyle}>Confirmar nova senha</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmar ? "text" : "password"}
                placeholder="••••••••"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                style={{ ...inputStyle, paddingRight: 42, borderColor: confirmar && confirmar !== senha ? "#FCA5A5" : "#EDE8EA" }}
                disabled={!token}
              />
              <button type="button" onClick={() => setShowConfirmar(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#A8A29E", padding: 0 }}>
                <EyeIcon open={showConfirmar} />
              </button>
            </div>
            {confirmar && confirmar !== senha && (
              <p style={{ fontSize: 11, color: "#DC2626", marginTop: 5 }}>As senhas não coincidem</p>
            )}
          </div>

          {/* Requisitos */}
          <div style={{ background: "#F5F5F4", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ fontSize: 11, color: "#78716C", margin: 0, lineHeight: 1.8 }}>
              A senha deve ter: mínimo 8 caracteres · pelo menos 1 letra maiúscula · pelo menos 1 número
            </p>
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
              {erro}{" "}
              {erro.includes("expirado") && (
                <Link href="/esqueci-senha" style={{ color: "#DC2626", fontWeight: 700 }}>Solicitar novo link</Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token || !senhaOk || senha !== confirmar}
            style={{
              padding: "13px 0", borderRadius: 8, border: "none", marginTop: 4,
              background: (loading || !token || !senhaOk || senha !== confirmar) ? "#A8A29E" : "#1C1917",
              color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 15,
              cursor: (loading || !token || !senhaOk || senha !== confirmar) ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#78716C" }}>
            <Link href="/login" style={{ color: "#F472B6", fontWeight: 700, textDecoration: "none" }}>
              ← Voltar ao login
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9", fontFamily: "var(--font-nunito, Nunito, sans-serif)" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #EDE8EA", padding: "14px 16px", display: "flex", justifyContent: "flex-end" }}>
        <Link href="/catalago" style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #F472B6", background: "#FDF2F8", color: "#F472B6", fontFamily: "inherit", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
          Ver catálogo
        </Link>
      </div>
      <Suspense fallback={<div style={{ textAlign: "center", padding: 60, color: "#A8A29E" }}>Carregando...</div>}>
        <RedefinirSenhaForm />
      </Suspense>
    </div>
  )
}
