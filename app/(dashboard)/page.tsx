import { createClient } from "@/lib/supabase/server"
import { Users, LayoutGrid, TrendingUp, Flame, AlertTriangle, Sparkles } from "lucide-react"
import KpiCard from "@/components/KpiCard"
import TrendChart from "@/components/TrendChart"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*, org_unit:org_units(*, type:org_unit_types(*))")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  // Obtener todos los descendientes del nodo actual
  const { data: closure } = await supabase
    .from("org_unit_closure")
    .select("descendant_id, depth")
    .eq("ancestor_id", profile.org_unit_id)

  const descendantIds = closure?.map(c => c.descendant_id) ?? []

  // Obtener nodos hijos directos
  const { data: children } = await supabase
    .from("org_units")
    .select("*, type:org_unit_types(*)")
    .eq("parent_id", profile.org_unit_id)
    .order("name")

  // Obtener miembros en el subárbol
  const { count: memberCount } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .in("org_unit_id", descendantIds)

  // Obtener células en el subárbol
  const { data: celulaTypes } = await supabase
    .from("org_unit_types")
    .select("id")
    .eq("rank", 10)
  const celulaTypeIds = celulaTypes?.map(t => t.id) ?? []

  const { count: celulaCount } = await supabase
    .from("org_units")
    .select("*", { count: "exact", head: true })
    .in("type_id", celulaTypeIds)
    .in("id", descendantIds)

  // Reportes de esta semana
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  const weekStr = weekStart.toISOString().split("T")[0]

  const { data: reports } = await supabase
    .from("reports")
    .select("attendance, visits, decisions, week_start, org_unit_id")
    .in("org_unit_id", descendantIds)
    .gte("week_start", new Date(Date.now() - 56 * 86400000).toISOString().split("T")[0])
    .order("week_start", { ascending: true })

  const thisWeekReports = reports?.filter(r => r.week_start === weekStr) ?? []
  const totalAttendance = thisWeekReports.reduce((s, r) => s + (r.attendance ?? 0), 0)

  // Tendencia (últimas 8 semanas agrupadas)
  const trendMap: Record<string, number> = {}
  reports?.forEach(r => {
    trendMap[r.week_start] = (trendMap[r.week_start] ?? 0) + (r.attendance ?? 0)
  })
  const trendData = Object.entries(trendMap).slice(-8).map(([w, v]) => ({
    week: w.slice(5), value: v
  }))

  // Insight básico
  const firstVal = trendData[0]?.value ?? 0
  const lastVal  = trendData[trendData.length - 1]?.value ?? 0
  const growthPct = firstVal ? Math.round(((lastVal - firstVal) / firstVal) * 100) : 0

  const tier = profile.org_unit?.type?.tier
  const childLabel = profile.org_unit?.type?.child_label ?? "Subniveles"

  return (
    <div className="space-y-6">
      {/* Node header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
          <span className="text-xs font-medium uppercase tracking-wide text-brand-blue">
            {profile.org_unit?.type?.name}
          </span>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-brand-ink">
          {profile.org_unit?.name}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {profile.org_unit?.type?.role_label}: {profile.full_name}
        </p>
      </div>

      {/* AI Insight */}
      {trendData.length > 1 && (
        <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${growthPct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>Asistente SIDI:</strong>{" "}
            {growthPct >= 0
              ? `La asistencia creció ${growthPct}% en las últimas semanas.`
              : `La asistencia bajó ${Math.abs(growthPct)}% en las últimas semanas — vale la pena revisar.`}
            {" "}{thisWeekReports.length > 0 ? `Esta semana se registraron ${thisWeekReports.length} reportes.` : "Esta semana aún no hay reportes."}
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Miembros"            value={memberCount ?? 0}  icon={Users} />
        <KpiCard label="Células activas"     value={celulaCount ?? 0}  icon={LayoutGrid}  accent="#7F3FE5" />
        <KpiCard label="Asistencia sem."     value={totalAttendance}   icon={Flame}       accent="#DE7D37" />
        <KpiCard label="Crecimiento"
          value={`${growthPct > 0 ? "+" : ""}${growthPct}%`}
          icon={growthPct >= 0 ? TrendingUp : AlertTriangle}
          accent={growthPct >= 0 ? "#408F5E" : "#CF3930"} />
      </div>

      {/* Trend chart */}
      {trendData.length > 0 && <TrendChart data={trendData} />}

      {/* Children list */}
      {children && children.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-700 mb-2.5">{childLabel}</h2>
          <div className="sidi-card divide-y divide-stone-100">
            {children.map(ch => (
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
