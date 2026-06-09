"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/* ── types ── */
interface Config { loja_nome: string; loja_tagline: string; loja_email: string; whatsapp_numero: string }

/* ── Shared ── */
function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#78716C", marginBottom: 5 }}>{children}</label>
}
function Input({ value, onChange, placeholder, type = "text", disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{ display: "block", width: "100%", padding: "9px 12px", border: "1px solid #EDE8EA", borderRadius: 7, fontFamily: "inherit", fontSize: 13, fontWeight: 500, outline: "none", background: disabled ? "#FAFAF9" : "#fff", color: disabled ? "#A8A29E" : "#1C1917", boxSizing: "border-box" }} />
  )
}
function SaveBtn({ loading, saved, onClick }: { loading: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: saved ? "#16A34A" : loading ? "#E5E0DC" : "#1C1917", color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", transition: "background .2s" }}>
      {saved ? "✓ Salvo!" : loading ? "Salvando…" : "Salvar alterações"}
    </button>
  )
}
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "18px 22px", borderBottom: "1px solid #EDE8EA" }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 3 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: "22px" }}>{children}</div>
    </div>
  )
}

const SECTIONS = ["Loja", "WhatsApp", "Conta", "Segurança"] as const
type Section = (typeof SECTIONS)[number]

/* ── Section: Loja ── */
function SectionLoja() {
  const [cfg, setCfg] = useState<Config>({ loja_nome: "", loja_tagline: "", loja_email: "", whatsapp_numero: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    createClient().from("configuracoes").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setCfg({ loja_nome: data.loja_nome ?? "", loja_tagline: data.loja_tagline ?? "", loja_email: data.loja_email ?? "", whatsapp_numero: data.whatsapp_numero ?? "" })
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    await createClient().from("configuracoes").update({ loja_nome: cfg.loja_nome, loja_tagline: cfg.loja_tagline, loja_email: cfg.loja_email }).eq("id", 1)
    setSaving(false); setSaved(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#A8A29E" }}>Carregando…</div>

  return (
    <SectionCard title="Informações da loja" subtitle="Nome e descrição que aparecem no catálogo público">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><Label>Nome da loja</Label><Input value={cfg.loja_nome} onChange={(v) => setCfg((c) => ({ ...c, loja_nome: v }))} placeholder="Margarida Kids" /></div>
        <div><Label>Tagline</Label><Input value={cfg.loja_tagline} onChange={(v) => setCfg((c) => ({ ...c, loja_tagline: v }))} placeholder="Roupinhas para cada fase da sua criança" /></div>
        <div><Label>E-mail de contato</Label><Input value={cfg.loja_email} onChange={(v) => setCfg((c) => ({ ...c, loja_email: v }))} type="email" placeholder="contato@margaridakids.com" /></div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SaveBtn loading={saving} saved={saved} onClick={save} />
        </div>
      </div>
    </SectionCard>
  )
}

/* ── Section: WhatsApp ── */
function SectionWhatsApp() {
  const [numero, setNumero] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    createClient().from("configuracoes").select("whatsapp_numero").eq("id", 1).single().then(({ data }) => {
      setNumero(data?.whatsapp_numero ?? "")
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    await createClient().from("configuracoes").update({ whatsapp_numero: numero }).eq("id", 1)
    setSaving(false); setSaved(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), 2500)
  }

  const waLink = numero ? `https://wa.me/55${numero.replace(/\D/g, "")}` : null

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#A8A29E" }}>Carregando…</div>

  return (
    <SectionCard title="WhatsApp" subtitle="Número que recebe os pedidos do catálogo">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <Label>Número do WhatsApp</Label>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid #EDE8EA", borderRadius: 7, overflow: "hidden" }}>
            <span style={{ padding: "9px 12px", background: "#F5F5F4", color: "#78716C", fontSize: 13, fontWeight: 700, borderRight: "1px solid #EDE8EA", flexShrink: 0 }}>+55</span>
            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="11 99999-0000"
              style={{ flex: 1, padding: "9px 12px", border: "none", outline: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 500, background: "#fff" }} />
          </div>
          <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 5 }}>Somente números. Ex: 11999990000</div>
        </div>

        {waLink && (
          <div style={{ padding: "12px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 7, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>💬</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#16A34A" }}>Link de pré-visualização</div>
              <a href={waLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#16A34A", wordBreak: "break-all" }}>{waLink}</a>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SaveBtn loading={saving} saved={saved} onClick={save} />
        </div>
      </div>
    </SectionCard>
  )
}

/* ── Section: Conta ── */
function SectionConta() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email ?? "")
        setName((data.user.user_metadata?.full_name as string | undefined) ?? "")
      }
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true); setErr("")
    const { error } = await createClient().auth.updateUser({ email, data: { full_name: name } })
    setSaving(false)
    if (error) { setErr(error.message); return }
    setSaved(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#A8A29E" }}>Carregando…</div>

  return (
    <SectionCard title="Conta" subtitle="Informações do administrador">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><Label>Nome</Label><Input value={name} onChange={setName} placeholder="Seu nome" /></div>
        <div><Label>E-mail</Label><Input value={email} onChange={setEmail} type="email" placeholder="admin@exemplo.com" /></div>
        <div style={{ fontSize: 11, color: "#A8A29E" }}>Alterar o e-mail envia um link de confirmação para o novo endereço.</div>
        {err && <div style={{ padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, color: "#DC2626", fontSize: 12, fontWeight: 600 }}>{err}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SaveBtn loading={saving} saved={saved} onClick={save} />
        </div>
      </div>
    </SectionCard>
  )
}

/* ── Section: Segurança ── */
function SectionSeguranca() {
  const [current, setCurrent] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function save() {
    setErr("")
    if (!newPwd || newPwd.length < 6) { setErr("A senha deve ter pelo menos 6 caracteres."); return }
    if (newPwd !== confirm) { setErr("As senhas não coincidem."); return }
    setSaving(true)
    const supabase = createClient()
    // Re-authenticate with current password first
    const { data: userData } = await supabase.auth.getUser()
    const email = userData?.user?.email
    if (email && current) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current })
      if (signInErr) { setSaving(false); setErr("Senha atual incorreta."); return }
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setSaving(false)
    if (error) { setErr(error.message); return }
    setSaved(true); setCurrent(""); setNewPwd(""); setConfirm("")
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), 2500)
  }

  return (
    <SectionCard title="Segurança" subtitle="Altere sua senha de acesso ao painel">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><Label>Senha atual</Label><Input value={current} onChange={setCurrent} type="password" placeholder="••••••••" /></div>
        <div><Label>Nova senha</Label><Input value={newPwd} onChange={setNewPwd} type="password" placeholder="••••••••" /></div>
        <div><Label>Confirmar nova senha</Label><Input value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" /></div>
        {err && <div style={{ padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, color: "#DC2626", fontSize: 12, fontWeight: 600 }}>{err}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SaveBtn loading={saving} saved={saved} onClick={save} />
        </div>
      </div>
    </SectionCard>
  )
}

/* ── Main ── */
export default function ConfiguracoesPage() {
  const [section, setSection] = useState<Section>("Loja")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "inherit" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1C1917" }}>Configurações</h1>
        <p style={{ color: "#A8A29E", fontSize: 13, marginTop: 2 }}>Personalize sua loja e gerencie sua conta</p>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Sub-nav */}
        <div style={{ flexShrink: 0, width: 170 }}>
          <div style={{ background: "#fff", border: "1px solid #EDE8EA", borderRadius: 10, overflow: "hidden" }}>
            {SECTIONS.map((s) => (
              <button key={s} onClick={() => setSection(s)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", border: "none", background: section === s ? "#FDF2F8" : "transparent", color: section === s ? "#F472B6" : "#78716C", fontFamily: "inherit", fontWeight: section === s ? 700 : 600, fontSize: 13, cursor: "pointer", borderLeft: `3px solid ${section === s ? "#F472B6" : "transparent"}` }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {section === "Loja" && <SectionLoja />}
          {section === "WhatsApp" && <SectionWhatsApp />}
          {section === "Conta" && <SectionConta />}
          {section === "Segurança" && <SectionSeguranca />}
        </div>
      </div>
    </div>
  )
}
