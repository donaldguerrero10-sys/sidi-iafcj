"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, Flame, AlertTriangle, Check } from "lucide-react"

export default function CelulasPage() {
  const supabase = createClient()
  const [cells,   setCells]   = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [filter,  setFilter]  = useState<"todas"|"listas"|"atrasadas">("todas")
  const [loading, setLoading] = useState(true)

  const weekStr = new Date(Date.now() - new Date().getDay() * 86400000 + 86400000).toISOString().split("T")[0]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from("user_profiles").select("org_unit_id").eq("id", user.id).single()
      const { data: cl } = await supabase.from("org_unit_closure").select("descendant_id").eq("ancestor_id", (p as any)?.org_unit_id)
      const ids = cl?.map((c: any) => c.descendant_id) ?? []
      const { data: ct } = await supabase.from("org_unit_types").select("id").eq("rank", 10)
      const typeIds = ct?.map((t: any) => t.id) ?? []
      const { data: c } = await supabase.from("org_units").select("*").in("type_id", typeIds).in("id", ids)
      setCells(c ?? [])
      const cellIds = (c ?? []).map((x: any) => x.id)
      const { data: m } = await supabase.from("members").select("*").in("org_unit_id", cellIds)
      setMembers(m ?? [])
      const { data: r } = await supabase.from("reports").select("*").in("org_unit_id", cellIds).eq("week_start", weekStr)
      setReports(r ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-16 text-stone-400">Cargando...</div>

  const reportMap: Record<string, any> = {}
  reports.forEach(r => { reportMap[r.org_unit_id] = r })
  const memberMap: Record<string, number> = {}
  members.forEach(m => { memberMap[m.org_unit_id] = (memberMap[m.org_unit_id] ?? 0) + 1 })

  const filtered = cells.filter(c => {
    const mc = memberMap[c.id] ?? 0
    if (filter === "listas")   return mc >= 12
    if (filter === "atrasadas") return !reportMap[c.id]
    return true
  })

  const CHIPS: ["todas"|"listas"|"atrasadas", string][] = [["todas","Todas"],["listas","Listas a multiplicar"],["atrasadas","Sin reporte esta semana"]]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-brand-ink">Células</h1>
        <p className="text-sm text-stone-500 mt-1">{cells.length} células en tu alcance</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CHIPS.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={filter===k ? {background:"#123DB5",color:"#fff"} : {background:"#F4F1EB",color:"#1F1B18"}}>
            {l}
          </button>
        ))}
      </div>

      <div className="sidi-card divide-y divide-stone-100">
        {filtered.map(c => {
          const mc = memberMap[c.id] ?? 0
          const r  = reportMap[c.id]
          const lista = mc >= 12
          return (
            <div key={c.id} className="px-4 py-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-brand-ink">{c.name}</span>
                  {lista && <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600"><Flame size={11}/>Lista</span>}
                </div>
                {r
                  ? <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700"><Check size={11}/>Al día</span>
                  : <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-700"><AlertTriangle size={11}/>Sin reporte</span>
                }
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-400">
                <span className="flex items-center gap-1"><Users size={11}/>{mc} miembros</span>
                {r && <span>{r.attendance} asistentes esta semana</span>}
              </div>
            </div>
          )
        })}
        {!filtered.length && (
          <div className="px-4 py-8 text-center text-sm text-stone-400">Sin resultados para este filtro.</div>
        )}
      </div>
    </div>
  )
}
