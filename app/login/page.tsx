"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !senha) { setErro("Preencha todos os campos."); return }
    setErro(null)
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro("E-mail ou senha inválidos. Tente novamente.")
      setCarregando(false)
      return
    }

    router.push("/admin/dashboard")
    router.refresh()
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAFAF9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "var(--font-nunito), 'Nunito', sans-serif",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #EDE8EA",
        padding: "40px 32px 36px",
        width: "100%",
        maxWidth: 380,
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 100, height: 3, borderRadius: 2,
              background: "linear-gradient(90deg,#93C5FD,#6EE7B7,#FBBF24,#F472B6)",
            }}/>
            <span style={{ fontWeight: 800, fontSize: 20, color: "#1C1917", letterSpacing: "-0.3px" }}>
              Margarida Kids
            </span>
          </div>
          <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
            Painel administrativo
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{
              fontWeight: 700, fontSize: 12, display: "block", marginBottom: 6,
              color: "#78716C", textTransform: "uppercase", letterSpacing: "0.4px",
            }}>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%", padding: "13px 14px",
                border: "1px solid #EDE8EA", borderRadius: 8,
                fontFamily: "inherit", fontSize: 15, color: "#1C1917",
                background: "#fff", outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#F472B6"; e.target.style.boxShadow = "0 0 0 3px rgba(244,114,182,0.10)" }}
              onBlur={(e) => { e.target.style.borderColor = "#EDE8EA"; e.target.style.boxShadow = "none" }}
            />
          </div>

          <div>
            <label style={{
              fontWeight: 700, fontSize: 12, display: "block", marginBottom: 6,
              color: "#78716C", textTransform: "uppercase", letterSpacing: "0.4px",
            }}>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{
                width: "100%", padding: "13px 14px",
                border: "1px solid #EDE8EA", borderRadius: 8,
                fontFamily: "inherit", fontSize: 15, color: "#1C1917",
                background: "#fff", outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#F472B6"; e.target.style.boxShadow = "0 0 0 3px rgba(244,114,182,0.10)" }}
              onBlur={(e) => { e.target.style.borderColor = "#EDE8EA"; e.target.style.boxShadow = "none" }}
            />
          </div>

          {erro && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 6, padding: "10px 14px",
              fontSize: 13, color: "#DC2626", fontWeight: 600,
            }} role="alert">{erro}</div>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: "100%", padding: 14, borderRadius: 8, border: "none",
              background: "#1C1917", color: "#fff",
              fontFamily: "inherit", fontWeight: 700, fontSize: 15,
              cursor: carregando ? "not-allowed" : "pointer",
              opacity: carregando ? 0.6 : 1,
              marginTop: 4,
              transition: "background 0.15s",
            }}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "#A8A29E", marginTop: 24 }}>
          <Link href="/" style={{ color: "#78716C", fontWeight: 600, textDecoration: "none" }}>
            Ver catálogo público
          </Link>
        </p>
      </div>
    </div>
  )
}
