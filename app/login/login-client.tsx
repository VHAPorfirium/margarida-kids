"use client"
import Image from "next/image"

import { useState } from "react"
import { useRouter } from "next/navigation"

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function EyeIcon({ open }: { open: boolean }) {
  return open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}

const LABEL: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: "#78716C",
  textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "11px 14px",
  border: "1px solid #EDE8EA", borderRadius: 8, fontFamily: "inherit",
  fontSize: 14, color: "#1C1917", background: "#FAFAF9", outline: "none",
}

function PasswordInput({ value, onChange, show, onToggle, hasError }: {
  value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; hasError?: boolean
}) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder="••••••••"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, paddingRight: 42, borderColor: hasError ? "#FCA5A5" : "#EDE8EA" }}
      />
      <button type="button" onClick={onToggle} style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", cursor: "pointer", color: "#A8A29E", padding: 0,
      }}>
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

export function LoginPageClient() {
  const router = useRouter()
  const [modo, setModo] = useState<"login" | "cadastro">("login")

  // Cadastro
  const [nome, setNome] = useState("")
  const [sobrenome, setSobrenome] = useState("")
  const [emailCadastro, setEmailCadastro] = useState("")
  const [telefoneCadastro, setTelefoneCadastro] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")

  // Login
  const [loginInput, setLoginInput] = useState("")  // email ou telefone
  const [senhaLogin, setSenhaLogin] = useState("")

  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [showSenhaLogin, setShowSenhaLogin] = useState(false)

  const senhaForcaMsg = senha.length === 0 ? "" :
    senha.length < 8 ? "Mínimo 8 caracteres" :
    !/[A-Z]/.test(senha) ? "Precisa de letra maiúscula" :
    !/[0-9]/.test(senha) ? "Precisa de número" : ""
  const senhaOk = senha.length >= 8 && /[A-Z]/.test(senha) && /[0-9]/.test(senha)

  function trocarModo(m: "login" | "cadastro") {
    setModo(m)
    setErro("")
    setSenha("")
    setConfirmar("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")

    if (modo === "cadastro") {
      if (!nome.trim()) return setErro("Informe seu nome")
      if (!sobrenome.trim()) return setErro("Informe seu sobrenome")
      if (!emailCadastro.trim() || !emailCadastro.includes("@")) return setErro("Informe um e-mail válido")
      const digits = telefoneCadastro.replace(/\D/g, "")
      if (digits.length !== 11) return setErro("Telefone deve ter DDD + 9 dígitos")
      if (!senhaOk) return setErro(senhaForcaMsg || "Senha inválida")
      if (senha !== confirmar) return setErro("As senhas não coincidem")

      setLoading(true)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: `${nome.trim()} ${sobrenome.trim()}`,
          telefone: digits,
          email: emailCadastro.trim().toLowerCase(),
          senha,
        }),
      })
      const json = await res.json()
      setLoading(false)
      if (!res.ok) return setErro(json.error ?? "Erro desconhecido")
      router.push("/meu-historico")
    } else {
      // Login — aceita email OU telefone
      const loginLimpo = loginInput.trim()
      if (!loginLimpo) return setErro("Informe e-mail ou telefone")
      if (!senhaLogin) return setErro("Informe a senha")

      // Se parece telefone, formata; senão manda como e-mail
      const ehEmail = loginLimpo.includes("@")
      const loginPayload = ehEmail ? loginLimpo : loginLimpo.replace(/\D/g, "")

      if (!ehEmail && loginPayload.length !== 11) {
        return setErro("Telefone deve ter DDD + 9 dígitos")
      }

      setLoading(true)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginPayload, senha: senhaLogin }),
      })
      const json = await res.json()
      setLoading(false)
      if (!res.ok) return setErro(json.error ?? "Erro desconhecido")
      router.push("/meu-historico")
    }
  }



  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9", fontFamily: "var(--font-nunito, Nunito, sans-serif)" }}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EDE8EA", padding: "14px 16px", display: "flex", justifyContent: "flex-end" }}>
        <a href="/catalago" style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #F472B6", background: "#FDF2F8", color: "#F472B6", fontFamily: "inherit", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
          Ver catálogo
        </a>
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "40px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <Image src="/logo.png" alt="Margarida Kids" width={76} height={76} style={{ objectFit: "contain" }} />
            </div>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917", marginBottom: 6 }}>
            {modo === "login" ? "Acessar meus pedidos" : "Criar conta"}
          </h1>
          <p style={{ fontSize: 13, color: "#78716C" }}>
            {modo === "login"
              ? "Entre com seu e-mail ou telefone"
              : "Cadastre-se para acompanhar seus pedidos"}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "#F5F5F4", borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
          {(["login", "cadastro"] as const).map((m) => (
            <button key={m} type="button" onClick={() => trocarModo(m)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 700, fontSize: 13,
              background: modo === m ? "#fff" : "transparent",
              color: modo === m ? "#1C1917" : "#78716C",
              boxShadow: modo === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all .15s",
            }}>
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {modo === "cadastro" ? (
            <>
              {/* Nome + Sobrenome */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={LABEL}>Nome</label>
                  <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={LABEL}>Sobrenome</label>
                  <input type="text" placeholder="Sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label style={LABEL}>E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={emailCadastro}
                  onChange={(e) => setEmailCadastro(e.target.value)}
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>

              {/* Telefone */}
              <div>
                <label style={LABEL}>Telefone (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="(00) 9 0000-0000"
                  value={telefoneCadastro}
                  onChange={(e) => setTelefoneCadastro(maskTelefone(e.target.value))}
                  style={inputStyle}
                />
              </div>

              {/* Senha */}
              <div>
                <label style={LABEL}>Senha</label>
                <PasswordInput value={senha} onChange={setSenha} show={showSenha} onToggle={() => setShowSenha((v) => !v)} />
                {senhaForcaMsg && <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 5 }}>{senhaForcaMsg}</p>}
                {senhaOk && <p style={{ fontSize: 11, color: "#16A34A", marginTop: 5 }}>Senha válida ✓</p>}
              </div>

              {/* Confirmar senha */}
              <div>
                <label style={LABEL}>Confirmar senha</label>
                <PasswordInput
                  value={confirmar} onChange={setConfirmar}
                  show={showConfirmar} onToggle={() => setShowConfirmar((v) => !v)}
                  hasError={!!confirmar && confirmar !== senha}
                />
                {confirmar && confirmar !== senha && (
                  <p style={{ fontSize: 11, color: "#DC2626", marginTop: 5 }}>As senhas não coincidem</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Login: e-mail ou telefone */}
              <div>
                <label style={LABEL}>E-mail ou telefone</label>
                <input
                  type="text"
                  placeholder="seu@email.com ou (00) 9 0000-0000"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  style={inputStyle}
                  autoComplete="username"
                />
              </div>

              {/* Senha */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ ...LABEL, marginBottom: 0 }}>Senha</label>
                  <a href="/esqueci-senha" style={{ fontSize: 12, color: "#F472B6", fontWeight: 600, textDecoration: "none" }}>
                    Esqueci minha senha
                  </a>
                </div>
                <PasswordInput
                  value={senhaLogin} onChange={setSenhaLogin}
                  show={showSenhaLogin} onToggle={() => setShowSenhaLogin((v) => !v)}
                />
              </div>
            </>
          )}

          {erro && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "13px 0", borderRadius: 8, border: "none",
              background: loading ? "#A8A29E" : "#1C1917",
              color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
            }}
          >
            {loading ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  )
}
