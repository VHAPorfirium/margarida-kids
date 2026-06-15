import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()

  const supabase = createServiceClient()
  const { error } = await supabase.storage
    .from("produtos")
    .upload(path, bytes, { contentType: file.type, cacheControl: "3600", upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from("produtos").getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
