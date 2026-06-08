import { AdminSidebar } from "./admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 bg-zinc-50 dark:bg-black">
      <AdminSidebar />
      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
