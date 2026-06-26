"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Check, AlertTriangle, Plus } from "lucide-react"

export default function ReportesPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [cells,   setCells]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState({ attendance: 0, visits: 0, decisions: 0, notes: "" })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState("")

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  const weekStr = weekStart.toISOString().split("T")[0]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from("user_profiles")
        .select("*, org_unit:org_units(*, type:org_unit_types(*))")
        .eq("id", user.id).single()
      setProfile(p)

      const { data: closure } = await supabase.from("org_unit_closure")
        .select("descendant_id").eq("ancestor_id", p?.org_unit_id)
      const ids = closure?.map((c: any) => c.descendant_id) ?? []

      const { data: celulaTypes } = await supabase.from("org_unit_types").select("id").eq("rank", 10)
      const typeIds = celulaTypes?.map((t: any) => t.id) ?? []

      const { data: c } = await supabase.from("org_units")
        .select("*").in("type_id", typeIds).in("id", ids)
      setCells(c ?? [])

      const { data: r } = await supabase.from("reports")
        .select("*").in("org_unit_id", ids)
        .gte("week_start", new Date(Date.now() - 56 * 86400000).toISOString().split("T")[0])
        .order("week_start", { ascending: false })
      setReports(r ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function saveReport(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError("")
    const { error } = await supabase.from("reports").upsert({
      org_unit_id:  profile.org_unit_id,
      reported_by:  profile.id,
      week_start:   weekStr,
      attendance:   form.attendance,
      visits:       form.visits,
      decisions:    form.decisions,
      notes:        form.notes,
    }, { onConflict: "org_unit_id,week_start" })
    if (error) { setError(error.message); setSaving(false); return }
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="text-center py-16 text-stone-400">Cargando...</div>

  const isLeader = profile?.org_unit?.type?.rank === 10
  const thisWeekMap: Record<string, any> = {}
  reports.filter(r => r.week_start === weekStr).forEach(r => { thisWeekMap[r.org_unit_id] = r })

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-brand-ink">Reportes semanales</h1>

      {/* Leader: submit report */}
      {isLeader && (
        <div className="sidi-card p-5">
          <h2 className="text-sm font-semibold text-stone-700 mb-4">
            Reporte de esta semana · {weekStr}
          </h2>
          <form onSubmit={saveReport} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[["Asistencia","attendance"],["Visitas","visits"],["Decisiones","decisions"]].map(([l,k]) => (
                <label key={k} className="block">
                  <span className="text-xs text-stone-500 mb-1 block">{l}</span>
                  <input type="number" min="0" value={(form as any)[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: +e.target.value }))}
                    className="sidi-input" />
                </label>
              ))}
            </div>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Notas (opcional)</span>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} className="sidi-input resize-none" placeholder="Algo importante esta semana..." />
            </label>
            {error && <p className="text-xs text-brand-red">{error}</p>}
            <button type="submit" disabled={saving} className="sidi-btn-primary disabled:opacity-60">
              {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar reporte"}
            </button>
            {saved && <p className="text-xs text-brand-green flex items-center gap-1"><Check size={12}/>Tu supervisor lo puede ver ahora mismo.</p>}
          </form>
        </div>
      )}

      {/* Status of all cells */}
      {cells.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-700 mb-2.5">
            Estado esta semana · {cells.length} células
          </h2>
          <div className="sidi-card divide-y divide-stone-100">
            {cells.map(c => {
              const r = thisWeekMap[c.id]
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-brand-ink">{c.name}</p>
                    {r && <p className="text-xs text-stone-400 mt-0.5">{r.attendance} asistentes · {r.visits} visitas · {r.decisions} decisiones</p>}
                  </div>
                  {r
                    ? <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700"><Check size={12}/>Al día</span>
                    : <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-700"><AlertTriangle size={12}/>Sin reporte</span>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* History */}
      {reports.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-700 mb-2.5">Historial reciente</h2>
          <div className="sidi-card divide-y divide-stone-100">
            {reports.slice(0, 20).map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-stone-500 font-mono text-xs">{r.week_start}</span>
                <div className="flex items-center gap-4 text-brand-ink">
                  <span><strong>{r.attendance}</strong> asist.</span>
                  <span><strong>{r.visits}</strong> vis.</span>
                  <span><strong>{r.decisions}</strong> dec.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
