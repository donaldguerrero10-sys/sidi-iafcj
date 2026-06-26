import type { LucideIcon } from "lucide-react"

interface Props {
  label:   string
  value:   string | number
  icon:    LucideIcon
  accent?: string
  onClick?: () => void
  sub?:    string
}

export default function KpiCard({ label, value, icon: Icon, accent, onClick, sub }: Props) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag onClick={onClick}
      className={`sidi-card p-4 sm:p-5 text-left w-full ${onClick ? "hover:shadow-md hover:border-stone-300 transition-all cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</span>
        <Icon size={16} style={{ color: accent ?? "#123DB5" }} />
      </div>
      <div className="font-mono text-2xl sm:text-3xl font-semibold" style={{ color: accent ?? "#1F1B18" }}>
        {value}
      </div>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </Tag>
  )
}
