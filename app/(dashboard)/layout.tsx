"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import AppHeader from "@/components/AppHeader"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router  = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      const { data: p } = await supabase
        .from("user_profiles")
        .select("*, org_unit:org_units(*, type:org_unit_types(*))")
        .eq("id", user.id)
        .single()
      if (!p) { router.push("/login"); return }
      setProfile(p)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-stone-400">Cargando SIDI...</p>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <h2 className="font-display font-bold text-xl mb-2">Sin acceso configurado</h2>
        <p className="text-stone-500 text-sm max-w-sm">Tu cuenta existe pero aún no tiene un nodo asignado. Pide a tu pastor que configure tu acceso.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader profile={profile} />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
