import { redirect } from "next/navigation"
import { lerSessao } from "@/lib/auth"
import { LoginPageClient } from "./login-client"

export default async function LoginPage() {
  const telefone = await lerSessao()
  if (telefone) redirect("/meu-historico")
  return <LoginPageClient />
}
