"use client"

import { useState } from "react"
import { AdminSidebar } from "./admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAFAF9" }}>
      <AdminSidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Mobile topbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px",
          background: "#fff", borderBottom: "1px solid #EDE8EA",
        }}
          className="md-hide-topbar"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#78716C", display: "flex", padding: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#1C1917" }}>Margarida Kids</span>
        </div>

        <div style={{ flex: 1, padding: "28px 24px 48px", maxWidth: 1080, margin: "0 auto", width: "100%" }}>
          {children}
        </div>
      </main>
    </div>
  )
}
