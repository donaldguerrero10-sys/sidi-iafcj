import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AppHeader from "@/components/AppHeader"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(`*, org_unit:org_units(*, type:org_unit_types(*))`)
    .eq("id", user.id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h2 className="font-display font-bold text-xl mb-2">Sin acceso configurado</h2>
          <p className="text-stone-500 text-sm max-w-sm">Tu cuenta existe pero aún no tiene un nodo asignado en la jerarquía. Pide a tu pastor o supervisor que configure tu acceso.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader profile={profile} />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
