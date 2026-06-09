"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    badge: null,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    label: "Produtos",
    href: "/admin/produtos",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    label: "Estoque",
    href: "/admin/estoque",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
  {
    label: "Configuracoes",
    href: "/admin/configuracoes",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
]

function RainbowBar({ width = 90 }: { width?: number }) {
  return (
    <div style={{
      width, height: 2.5, borderRadius: 2,
      background: "linear-gradient(90deg,#93C5FD,#6EE7B7,#FBBF24,#F472B6)",
    }}/>
  )
}

export function AdminSidebar({ sidebarOpen, onClose }: { sidebarOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 49 }}
        />
      )}
      <aside style={{
        width: 220, flexShrink: 0, background: "#fff",
        borderRight: "1px solid #EDE8EA",
        position: "sticky", top: 0, height: "100vh",
        display: "flex", flexDirection: "column",
        zIndex: 50, transition: "left 0.25s",
      }}
        className={sidebarOpen ? "sidebar-open" : ""}
      >
        {/* Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #EDE8EA" }}>
          <div style={{ display: "inline-flex", flexDirection: "column", gap: 5 }}>
            <RainbowBar />
            <span style={{ fontWeight: 800, fontSize: 14, color: "#1C1917" }}>Margarida Kids</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 6,
                  fontWeight: active ? 700 : 600, fontSize: 13,
                  textDecoration: "none",
                  color: active ? "#F472B6" : "#78716C",
                  background: active ? "#FDF2F8" : "transparent",
                  transition: "background 0.12s, color 0.12s",
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {item.label === "Configuracoes" ? "Configurações" : item.label}
              </Link>
            )
          })}

          {/* Ver loja */}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #EDE8EA" }}>
            <Link
              href="/"
              target="_blank"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 6,
                fontWeight: 600, fontSize: 13,
                textDecoration: "none", color: "#78716C",
                transition: "background 0.12s, color 0.12s",
              }}
            >
              <span style={{ flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </span>
              Ver loja
            </Link>
          </div>
        </nav>

        {/* User footer */}
        <div style={{
          padding: "12px 14px", borderTop: "1px solid #EDE8EA",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#F472B6",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0,
          }}>M</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>Margarida</div>
            <div style={{ fontSize: 11, color: "#A8A29E" }}>Admin</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#A8A29E", fontSize: 12, fontWeight: 600, padding: 0,
              fontFamily: "inherit",
            }}
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
