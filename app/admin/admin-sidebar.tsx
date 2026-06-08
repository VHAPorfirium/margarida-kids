"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, BarChart3, Boxes } from "lucide-react"

import { cn } from "@/lib/utils"

const links = [
  {
    href: "/admin/produtos",
    label: "Produtos",
    icon: Package,
    disabled: false,
  },
  {
    href: "/admin/estoque",
    label: "Estoque (em breve)",
    icon: Boxes,
    disabled: true,
  },
  {
    href: "/admin/metricas",
    label: "Métricas (em breve)",
    icon: BarChart3,
    disabled: true,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r bg-white px-3 py-8 dark:bg-zinc-950">
      <div className="px-3 pb-6">
        <p className="text-lg font-semibold leading-tight">Margarida Kids</p>
        <p className="text-muted-foreground text-xs">Painel administrativo</p>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon, disabled }) => {
          const active = pathname?.startsWith(href)

          if (disabled) {
            return (
              <span
                key={href}
                className="text-muted-foreground/60 flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <Icon className="size-4" />
                {label}
              </span>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
