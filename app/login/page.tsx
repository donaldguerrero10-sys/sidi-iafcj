"use client"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError("Correo o contraseña incorrectos."); setLoading(false); return }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "radial-gradient(circle at 18% 15%,#24309C 0%,#11173A 45%,#0A0D22 100%)" }}>

      {/* Logo + wordmark */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <Image src="/logo.png" alt="IAFCJ" width={56} height={60} className="w-auto h-14" priority />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-extrabold text-2xl text-white tracking-tight">SIDI IAFCJ</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-bright" />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
          </div>
          <p className="text-xs text-white/50 mt-0.5">Así como Jesús</p>
        </div>
      </div>

      {/* Card */}
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
        <div>
          <h1 className="font-display font-bold text-lg text-brand-ink">Inicia sesión</h1>
          <p className="text-xs text-stone-500 mt-1">Sistema Integral de Discipulado Inteligente</p>
        </div>

        <label className="block">
          <span className="text-xs text-stone-500 mb-1 block">Correo electrónico</span>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="correo@ifcj.org" className="sidi-input" autoComplete="email" />
        </label>

        <label className="block">
          <span className="text-xs text-stone-500 mb-1 block">Contraseña</span>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" className="sidi-input" autoComplete="current-password" />
        </label>

        {error && <p className="text-xs text-brand-red bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={loading} className="sidi-btn-primary w-full disabled:opacity-60">
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <p className="text-xs text-center text-stone-400">
          ¿No tienes cuenta? Tu pastor o supervisor te la crea en el sistema.
        </p>
      </form>
    </div>
  )
}
