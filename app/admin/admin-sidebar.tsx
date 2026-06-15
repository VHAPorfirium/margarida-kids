"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    label: "Produtos",
    href: "/admin/produtos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    label: "Estoque",
    href: "/admin/estoque",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
  {
    label: "Clientes",
    href: "/admin/clientes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
]

const VER_LOJA_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

export function AdminSidebar({ onClose, collapsed }: { onClose: () => void; collapsed?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <aside style={{
      width: collapsed ? 64 : 220,
      height: "100vh",
      background: "#fff",
      borderRight: "1px solid #EDE8EA",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      overflowX: "hidden",
      transition: "width 0.22s cubic-bezier(.4,0,.2,1)",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "14px 0" : "14px 16px",
        borderBottom: "1px solid #EDE8EA",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <img
          src="/logo.png"
          alt="Margarida Kids"
          style={{
            width: collapsed ? 38 : 84,
            height: "auto",
            objectFit: "contain",
            transition: "width 0.22s cubic-bezier(.4,0,.2,1)",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 10,
                padding: collapsed ? "10px 0" : "9px 12px",
                borderRadius: 6,
                fontWeight: active ? 700 : 600,
                fontSize: 13,
                textDecoration: "none",
                color: active ? "#F472B6" : "#78716C",
                background: active ? "#FDF2F8" : "transparent",
                transition: "background 0.12s, color 0.12s",
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{item.label}</span>}
            </Link>
          )
        })}

        {/* Ver loja */}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #EDE8EA" }}>
          <Link
            href="/catalago"
            target="_blank"
            title={collapsed ? "Ver loja" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 10,
              padding: collapsed ? "10px 0" : "9px 12px",
              borderRadius: 6,
              fontWeight: 600, fontSize: 13,
              textDecoration: "none", color: "#78716C",
              transition: "background 0.12s, color 0.12s",
            }}
          >
            <span style={{ flexShrink: 0 }}>{VER_LOJA_ICON}</span>
            {!collapsed && <span style={{ whiteSpace: "nowrap" }}>Ver loja</span>}
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div style={{
        padding: collapsed ? "12px 0" : "12px 14px",
        borderTop: "1px solid #EDE8EA",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: collapsed ? 0 : 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "#F472B6",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0,
        }}>M</div>
        {!collapsed && (
          <>
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
          </>
        )}
      </div>
    </aside>
  )
}
