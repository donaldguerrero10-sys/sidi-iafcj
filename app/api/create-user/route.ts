import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, whatsapp, password, unit_id, rank } = body

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.rank >= rank) {
    return NextResponse.json({ error: "Sin permiso para crear este rol" }, { status: 403 })
  }

  // Admin client (usa service_role key — solo en servidor)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: newUser, error: authErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  const { error: profileErr } = await admin.from("user_profiles").insert({
    id:          newUser.user!.id,
    org_id:      profile.org_id,
    org_unit_id: unit_id,
    full_name:   name,
    whatsapp:    whatsapp || null,
    rank,
    created_by:  user.id,
  })
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
