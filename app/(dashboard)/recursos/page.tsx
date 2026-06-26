"use client"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, FileText, GraduationCap, Sparkles, Upload, Plus, X } from "lucide-react"
import type { Resource } from "@/types"

const ICONS: Record<string, React.ElementType> = {
  curso: BookOpen, taller: Sparkles, manual: FileText, escuela: GraduationCap, libro: BookOpen,
}
const CAT_ORDER = ["general","gobierno","supervision","liderazgo","biblioteca"]
const CAT_LABEL: Record<string, string> = {
  general:"General", gobierno:"Gobierno eclesiástico",
  supervision:"Supervisión celular", liderazgo:"Liderazgo de célula", biblioteca:"Biblioteca",
}

export default function RecursosPage() {
  const supabase = createClient()
  const [resources, setResources] = useState<Resource[]>([])
  const [profile,   setProfile]   = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm,  setShowForm]  = useState(false)
  const [newRes,    setNewRes]    = useState({ title:"", type:"manual", category:"general", description:"" })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      setProfile(p)
      const { data: r } = await supabase.from("resources").select("*").order("created_at", { ascending: false })
      setResources(r ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function uploadResource(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    let fileUrl = null, fileName = null
    const file = fileRef.current?.files?.[0]
    if (file) {
      const ext  = file.name.split(".").pop()
      const path = `recursos/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from("sidi-recursos").upload(path, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("sidi-recursos").getPublicUrl(data.path)
        fileUrl  = urlData.publicUrl
        fileName = file.name
      }
    }
    const { data: p } = await supabase.from("user_profiles").select("org_id").eq("id", (await supabase.auth.getUser()).data.user!.id).single()
    await supabase.from("resources").insert({
      ...newRes,
      org_id:   (p as any)?.org_id,
      file_url: fileUrl,
      file_name: fileName,
      min_rank: 0, max_rank: 11,
    })
    const { data: r } = await supabase.from("resources").select("*").order("created_at", { ascending: false })
    setResources(r ?? [])
    setShowForm(false)
    setNewRes({ title:"", type:"manual", category:"general", description:"" })
    setUploading(false)
  }

  if (loading) return <div className="text-center py-16 text-stone-400">Cargando...</div>

  const canUpload = profile?.rank <= 3

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-brand-ink">Recursos y Biblioteca</h1>
        {canUpload && (
          <button onClick={() => setShowForm(s => !s)} className="sidi-btn-primary flex items-center gap-1.5">
            {showForm ? <X size={15}/> : <Plus size={15}/>}
            {showForm ? "Cancelar" : "Subir recurso"}
          </button>
        )}
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={uploadResource} className="sidi-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">Nuevo recurso</h2>
          <input required placeholder="Título" value={newRes.title}
            onChange={e => setNewRes(n => ({...n, title:e.target.value}))} className="sidi-input"/>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Tipo</span>
              <select value={newRes.type} onChange={e => setNewRes(n => ({...n, type:e.target.value}))} className="sidi-input bg-white">
                {["curso","taller","manual","escuela","libro"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-stone-500 mb-1 block">Categoría</span>
              <select value={newRes.category} onChange={e => setNewRes(n => ({...n, category:e.target.value}))} className="sidi-input bg-white">
                {CAT_ORDER.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
            </label>
          </div>
          <textarea placeholder="Descripción" value={newRes.description}
            onChange={e => setNewRes(n => ({...n, description:e.target.value}))}
            rows={2} className="sidi-input resize-none"/>
          <label className="block">
            <span className="text-xs text-stone-500 mb-1 block">Archivo (PDF, video, etc.)</span>
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-3 cursor-pointer hover:border-brand-blue transition-colors"
              onClick={() => fileRef.current?.click()}>
              <Upload size={16} className="text-stone-400"/>
              <span className="text-sm text-stone-400">{fileRef.current?.files?.[0]?.name ?? "Seleccionar archivo"}</span>
            </div>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.mp4,.mov,.docx,.pptx"/>
          </label>
          <button type="submit" disabled={uploading} className="sidi-btn-primary disabled:opacity-60">
            {uploading ? "Subiendo..." : "Guardar recurso"}
          </button>
        </form>
      )}

      {/* Resources by category */}
      {CAT_ORDER.map(cat => {
        const group = resources.filter(r => r.category === cat)
        if (!group.length) return null
        return (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-stone-700 mb-2.5">{CAT_LABEL[cat]}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {group.map(r => {
                const Icon = ICONS[r.type] ?? BookOpen
                return (
                  <div key={r.id} className="sidi-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className="text-brand-blue"/>
                      <span className="text-xs font-medium uppercase tracking-wide text-stone-400">{r.type}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-brand-ink mb-1">{r.title}</h3>
                    {r.description && <p className="text-xs text-stone-500 leading-relaxed">{r.description}</p>}
                    {r.file_url && (
                      <a href={r.file_url} target="_blank" rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline">
                        <FileText size={12}/> {r.file_name ?? "Abrir archivo"}
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {!resources.length && (
        <div className="text-center py-16 text-stone-400">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30"/>
          <p className="text-sm">Aún no hay recursos. {canUpload ? "Sube el primero." : "Tu pastor los irá agregando."}</p>
        </div>
      )}
    </div>
  )
}
