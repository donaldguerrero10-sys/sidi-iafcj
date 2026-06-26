"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, LayoutDashboard, FileText, BookOpen, Users, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/types"

const NAV = [
  { href: "/dashboard",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/dashboard/celulas",  label: "Células",    icon: Users },
  { href: "/dashboard/reportes", label: "Reportes",   icon: FileText },
  { href: "/dashboard/recursos", label: "Recursos",   icon: BookOpen },
]

export default function AppHeader({ profile }: { profile: UserProfile & { org_unit: any } }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
      {/* Gradient bar */}
      <div className="h-0.5" style={{ background: "linear-gradient(90deg,#123DB5,#7F3FE5,#B8E04F)" }} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.png" alt="IAFCJ" width={36} height={38} className="h-9 w-auto" />
            <div className="leading-tight hidden sm:block">
              <div className="flex items-center gap-1">
                <span className="font-display font-extrabold text-base text-brand-blue tracking-tight">SIDI IAFCJ</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-bright" />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
              </div>
              <p className="text-xs text-stone-400 -mt-0.5">Así como Jesús</p>
            </div>
          </div>

          {/* User info + actions */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-brand-ink leading-tight">{profile.full_name}</p>
              <p className="text-xs text-stone-400">{profile.org_unit?.type?.role_label}</p>
            </div>
            {profile.rank <= 3 && (
              <Link href="/dashboard/usuarios"
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:border-stone-300 transition-colors">
                <Settings size={15} />
              </Link>
            )}
            <button onClick={logout} className="text-stone-400 hover:text-stone-600 p-2 transition-colors">
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {/* Nav row */}
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                  ${active ? "border-brand-blue text-brand-blue" : "border-transparent text-stone-400 hover:text-stone-600"}`}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
