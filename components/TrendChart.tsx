"use client"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts"

interface Props { data: { week: string; value: number }[] }

export default function TrendChart({ data }: Props) {
  return (
    <div className="sidi-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-stone-700 mb-3">Tendencia de asistencia · últimas semanas</h2>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#123DB5" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#123DB5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#A8A29E" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E7E5E4", fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#123DB5" strokeWidth={2} fill="url(#fill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
