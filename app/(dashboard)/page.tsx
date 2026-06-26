"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, LayoutGrid, TrendingUp, TrendingDown, Flame, AlertTriangle, Sparkles } from "lucide-react"
import KpiCard from "@/components/KpiCard"
import TrendChart from "@/components/TrendChart"

export default function DashboardPage() {
  const supabase = createClient()
  const [profile,  setProfile]  = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [kpis,     setKpis]     = useState({ members: 0, cells: 0, attendance: 0, growth: 0 })
  const [trend,    setTrend]    = useState<{ week: string; value: number }[]>([])
  const [insight,  setInsight]  = useState("")
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase
        .from("user_profiles")
        .select("*, org_unit:org_units(*, type:org_unit_types(*))")
        .eq("id", user.id)
        .single()
      setProfile(p)

      const { data: closure } = await supabase
        .from("org_unit_closure")
        .select("descendant_id")
        .eq("ancestor_id", p?.org_unit_id)
      const ids = closure?.map((c: any) => c.descendant_id) ?? []

      const { data: ch } = await supabase
        .from("org_units")
        .select("*, type:org_unit_types(*)")
        .eq("parent_id", p?.org_unit_id)
        .order("name")
      setChildren(ch ?? [])

      const { count: memberCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .in("org_unit_id", ids)

      const { data: ct } = await supabase.from("org_unit_types").select("id").eq("rank", 10)
      const typeIds = ct?.map((t: any) => t.id) ?? []
      const { count: cellCount } = await supabase
        .from("org_units")
        .select("*", { count: "exact", head: true })
        .in("type_id", typeIds).in("id", ids)

      const { data: reports } = await supabase
        .from("reports")
        .select("attendance, week_start")
        .in("org_unit_id", ids)
        .gte("week_start", new Date(Date.now() - 56 * 86400000).toISOString().split("T")[0])
        .order("week_start", { ascending: true })

      const tMap: Record<string, number> = {}
      reports?.forEach((r: any) => { tMap[r.week_start] = (tMap[r.week_start] ?? 0) + r.attendance })
      const tData = Object.entries(tMap).slice(-8).map(([w, v]) => ({ week: w.slice(5), value: v }))
      setTrend(tData)

      const first = tData[0]?.value ?? 0
      const last  = tData[tData.length - 1]?.value ?? 0
      const pct   = first ? Math.round(((last - first) / first) * 100) : 0

      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      const weekStr = weekStart.toISOString().split("T")[0]
      const thisWeek = reports?.filter((r: any) => r.week_start === weekStr) ?? []
      const totalAtt = thisWeek.reduce((s: number, r: any) => s + r.attendance, 0)

      setKpis({ members: memberCount ?? 0, cells: cellCount ?? 0, attendance: totalAtt, growth: pct })
      setInsight(pct >= 0
        ? `La asistencia creció ${pct}% en las últimas semanas.`
        : `La asistencia bajó ${Math.abs(pct)}% en las últimas semanas.`)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-16 text-stone-400">Cargando dashboard...</div>

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
          <span className="text-xs font-medium uppercase tracking-wide text-brand-blue">
            {profile?.org_unit?.type?.name}
          </span>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-brand-ink">
          {profile?.org_unit?.name}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {profile?.org_unit?.type?.role_label}: {profile?.full_name}
        </p>
      </div>

      {insight && (
        <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${kpis.growth >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <span><strong>Asistente SIDI:</strong> {insight}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Miembros"        value={kpis.members}    icon={Users} />
        <KpiCard label="Células activas" value={kpis.cells}      icon={LayoutGrid} accent="#7F3FE5" />
        <KpiCard label="Asistencia sem." value={kpis.attendance} icon={Flame} accent="#DE7D37" />
        <KpiCard label="Crecimiento"
          value={`${kpis.growth > 0 ? "+" : ""}${kpis.growth}%`}
          icon={kpis.growth >= 0 ? TrendingUp : TrendingDown}
          accent={kpis.growth >= 0 ? "#408F5E" : "#CF3930"} />
      </div>

      {trend.length > 0 && <TrendChart data={trend} />}

      {children.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-700 mb-2.5">
            {profile?.org_unit?.type?.child_label ?? "Subniveles"}
          </h2>
          <div className="sidi-card divide-y divide-stone-100">
            {children.map((ch: any) => (
              <div key={ch.id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-medium text-sm text-brand-ink">{ch.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{ch.type?.role_label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
