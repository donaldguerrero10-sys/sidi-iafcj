import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SIDI IAFCJ",
  description: "Sistema Integral de Discipulado Inteligente — Así como Jesús",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-stone-50 text-brand-ink antialiased">{children}</body>
    </html>
  )
}
