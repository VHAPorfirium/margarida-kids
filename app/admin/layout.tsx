"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AdminSidebar } from "./admin-sidebar"

const BOTTOM_NAV = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    label: "Produtos",
    href: "/admin/produtos",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    label: "Clientes",
    href: "/admin/clientes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: "Menu",
    href: "#menu",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
      else setSidebarOpen(false)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .admin-sidebar-wrap {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.22s cubic-bezier(.4,0,.2,1);
          }
          .admin-sidebar-wrap.open {
            transform: translateX(0);
          }
          .admin-overlay {
            display: block !important;
          }
          .admin-topbar-title {
            font-size: 14px !important;
          }
          .admin-content-inner {
            padding: 16px 14px 80px !important;
          }
          .admin-bottom-nav {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .admin-sidebar-wrap {
            position: sticky !important;
            top: 0;
            height: 100vh;
          }
          .admin-content-inner {
            padding: 28px 24px 48px;
            max-width: 1080px;
            margin: 0 auto;
          }
        }
        .admin-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.35);
          z-index: 40;
          backdrop-filter: blur(1px);
        }
        .admin-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 60px;
          background: #fff;
          border-top: 1px solid #EDE8EA;
          z-index: 30;
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#FAFAF9" }}>
        {/* Overlay */}
        {sidebarOpen && isMobile && (
          <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar wrapper — CSS handles positioning per breakpoint */}
        <div className={`admin-sidebar-wrap${sidebarOpen ? " open" : ""}`}
          style={{ flexShrink: 0, zIndex: 50 }}>
          <AdminSidebar onClose={() => { if (isMobile) setSidebarOpen(false) }} collapsed={!isMobile && sidebarCollapsed} />
        </div>

        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Topbar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px",
            background: "#fff", borderBottom: "1px solid #EDE8EA",
            position: "sticky", top: 0, zIndex: 10,
          }}>
            <button
              onClick={() => { if (isMobile) setSidebarOpen((v) => !v); else setSidebarCollapsed((v) => !v) }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#78716C", display: "flex", padding: 4, borderRadius: 6,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="admin-topbar-title" style={{ fontWeight: 800, fontSize: 15, color: "#1C1917" }}>Margarida Kids</span>
          </div>

          <div className="admin-content-inner" style={{ flex: 1, width: "100%" }}>
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav — mobile only */}
      <nav className="admin-bottom-nav">
        {BOTTOM_NAV.map((item) => {
          const isMenu = item.href === "#menu"
          const active = !isMenu && pathname?.startsWith(item.href)
          return (
            <button
              key={item.label}
              onClick={() => {
                if (isMenu) setSidebarOpen((v) => !v)
              }}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, background: "none", border: "none", cursor: "pointer",
                color: active ? "#F472B6" : "#A8A29E",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              {isMenu ? (
                <span style={{ color: sidebarOpen ? "#F472B6" : "#A8A29E" }}>{item.icon}</span>
              ) : (
                <Link href={item.href} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 3, textDecoration: "none",
                  color: active ? "#F472B6" : "#A8A29E",
                }}>
                  {item.icon}
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 600 }}>{item.label}</span>
                </Link>
              )}
              {isMenu && (
                <span style={{ fontSize: 10, fontWeight: 600, color: sidebarOpen ? "#F472B6" : "#A8A29E" }}>Menu</span>
              )}
            </button>
          )
        })}
      </nav>
    </>
  )
}
