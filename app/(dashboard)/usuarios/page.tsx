"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Check, UserPlus } from "lucide-react"

export default function UsuariosPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [users,   setUsers]   = useState<any[]>([])
  const [units,   setUnits]   = useState<any[]>([])
  const [types,   setTypes]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState({ name:"", email:"", whatsapp:"", password:"", unit_id:"", rank:10 })
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)
  const [err,     setErr]     = useState("")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from("user_profiles")
        .select("*, org_unit:org_units(*)").eq("id", user.id).single()
      setProfile(p)
      const { data: cl } = await supabase.from("org_unit_closure").select("descendant_id").eq("ancestor_id", (p as any)?.org_unit_id)
      const ids = cl?.map((c: any) => c.descendant_id) ?? []
      const { data: ou } = await supabase.from("org_units").select("*, type:org_unit_types(*)").in("id", ids)
      setUnits(ou ?? [])
      const { data: t } = await supabase.from("org_unit_types").select("*").order("rank")
      setTypes(t?.filter((t: any) => t.rank > (p?.rank ?? 0)) ?? [])
      const { data: up } = await supabase.from("user_profiles").select("*, org_unit:org_units(name)").in("org_unit_id", ids)
      setUsers(up ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr("")
    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setErr(json.error ?? "Error al crear usuario"); setSaving(false); return }
    setDone(true); setSaving(false)
    setTimeout(() => setDone(false), 3000)
    setForm({ name:"", email:"", whatsapp:"", password:"", unit_id:"", rank:10 })
    const { data: { user } } = await supabase.auth.getUser()
    const { data: p } = await supabase.from("user_profiles").select("org_unit_id").eq("id", user!.id).single()
    const { data: cl } = await supabase.from("org_unit_closure").select("descendant_id").eq("ancestor_id", (p as any)?.org_unit_id)
    const ids = cl?.map((c: any) => c.descendant_id) ?? []
    const { data: up } = await supabase.from("user_profiles").select("*, org_unit:org_units(name)").in("org_unit_id", ids)
    setUsers(up ?? [])
  }

  if (loading) return <div className="text-center py-16 text-stone-400">Cargando...</div>

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-brand-ink">Gestión de usuarios</h1>

      {/* Create user form */}
      <div className="sidi-card p-5">
        <h2 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-1.5">
          <UserPlus size={16}/>Crear nuevo usuario
        </h2>
        <form onSubmit={createUser} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Nombre completo</span>
              <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="sidi-input"/>
            </label>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">WhatsApp</span>
              <input value={form.whatsapp} onChange={e => setForm(f=>({...f,whatsapp:e.target.value}))} className="sidi-input" placeholder="+52 1 ..."/>
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Correo electrónico</span>
              <input required type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} className="sidi-input"/>
            </label>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Contraseña temporal</span>
              <input required type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} className="sidi-input"/>
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Rol</span>
              <select value={form.rank} onChange={e => setForm(f=>({...f,rank:+e.target.value}))} className="sidi-input bg-white">
                {types.map(t => <option key={t.id} value={t.rank}>{t.role_label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Nodo asignado</span>
              <select required value={form.unit_id} onChange={e => setForm(f=>({...f,unit_id:e.target.value}))} className="sidi-input bg-white">
                <option value="">Seleccionar...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
          </div>
          {err  && <p className="text-xs text-brand-red">{err}</p>}
          {done && <p className="text-xs text-brand-green flex items-center gap-1"><Check size={12}/>Usuario creado.</p>}
          <button type="submit" disabled={saving} className="sidi-btn-primary disabled:opacity-60">
            {saving ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
      </div>

      {/* Users list */}
      <div>
        <h2 className="text-sm font-semibold text-stone-700 mb-2.5">Usuarios en tu alcance ({users.length})</h2>
        <div className="sidi-card divide-y divide-stone-100">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-brand-ink">{u.full_name}</p>
                <p className="text-xs text-stone-400">{u.org_unit?.name} · rango {u.rank}</p>
              </div>
              {u.whatsapp && <span className="text-xs text-stone-400">{u.whatsapp}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
