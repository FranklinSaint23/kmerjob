'use client'

import { CheckCircle2, Loader2, Sparkles, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'

import type { CvProfileRow } from '@/lib/types/database'

interface UploadResponse {
  status: 'ok'
  profile: CvProfileRow
  analyzedBy: 'groq' | 'rules'
}

interface UploadError {
  error: string
  status?: string
  needsManualInput?: boolean
}

export function CvUploadForm({ onUploaded }: { onUploaded: (profile: CvProfileRow) => void }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/cv', { method: 'POST', body: formData })
      const body = (await res.json()) as UploadResponse | UploadError

      if (!res.ok || 'error' in body) {
        setError('error' in body ? body.error ?? "Échec de l'analyse." : "Échec de l'analyse.")
        return
      }

      onUploaded(body.profile)
    } catch {
      setError('Connexion impossible. Vérifie ta connexion et réessaie.')
    } finally {
      setUploading(false)
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) void upload(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging
            ? 'border-brand-600 bg-brand-50 dark:bg-brand-500/10'
            : 'border-black/[.12] hover:border-brand-600/40 dark:border-white/[.15]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" strokeWidth={1.75} />
            <p className="mt-3 font-medium text-zinc-700 dark:text-zinc-300">
              Analyse de {fileName}…
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Extraction du texte, puis analyse par IA.
            </p>
          </>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <UploadCloud className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="mt-3 font-medium text-zinc-700 dark:text-zinc-300">
              Glisse ton CV ici ou clique pour choisir un fichier
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">PDF ou TXT — 5 Mo maximum</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
        Analysé par IA quand disponible, avec une extraction par règles en repli.
      </div>
    </div>
  )
}

export function CvSummary({ profile }: { profile: CvProfileRow }) {
  return (
    <div className="rounded-2xl border border-black/[.06] bg-white p-6 shadow-[var(--shadow-card)] dark:border-white/[.08] dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-400">
        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
        Profil analysé
        {profile.extracted_by === 'rules' && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            mode simplifié
          </span>
        )}
      </div>

      {profile.summary && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{profile.summary}</p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <Stat label="Expérience" value={`${profile.experience_years} an${profile.experience_years > 1 ? 's' : ''}`} />
        <Stat label="Diplôme" value={profile.education_label} />
        <Stat label="Ville" value={profile.location ?? 'Non précisée'} />
        <Stat label="Langues" value={profile.languages.length > 0 ? profile.languages.join(', ') : 'Non précisées'} />
      </dl>

      {profile.skills.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Compétences détectées</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-white/[.06] dark:text-zinc-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  )
}
