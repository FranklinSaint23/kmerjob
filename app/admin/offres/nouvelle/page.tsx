'use client'

import { Save } from 'lucide-react'
import { useActionState } from 'react'

import { createOffer, type OfferFormState } from '@/lib/actions/admin'
import { CITY_NAMES } from '@/lib/geo'

const initialState: OfferFormState = { error: null }

const CATEGORIES = ['Fonction publique', 'Grande entreprise', 'ONG / International', 'Privée informelle']
const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Non précisé']

export default function NouvelleOffrePage() {
  const [state, formAction, pending] = useActionState(createOffer, initialState)

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Publier une offre
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Saisie manuelle — le contenu est réputé fiable, choisis le niveau qui correspond.
      </p>

      <form
        action={formAction}
        className="mt-7 space-y-5 rounded-2xl border border-black/[.06] bg-white p-6 shadow-[var(--shadow-card)] dark:border-white/[.08] dark:bg-zinc-900"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Intitulé du poste" name="title" required />
          <Field label="Entreprise" name="company" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Catégorie" name="category" options={CATEGORIES} />
          <Field label="Secteur" name="sector" placeholder="Ex. Comptabilité" />
          <SelectField label="Contrat" name="contract_type" options={CONTRACT_TYPES} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ville</span>
              <input
                name="location"
                list="villes"
                placeholder="Ex. Douala"
                className={inputClass}
              />
            </label>
            <datalist id="villes">
              {CITY_NAMES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <Field label="Séniorité" name="seniority" placeholder="Ex. Junior, Confirmé, Senior" />
        </div>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description *</span>
          <textarea
            name="description"
            required
            rows={5}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Compétences requises
          </span>
          <input name="requirements" placeholder="Séparées par des virgules : Excel, comptabilité, SAP" className={inputClass} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Salaire" name="salary" placeholder="Ex. 250 000 - 350 000 FCFA" />
          <Field label="Date limite" name="deadline" type="date" />
        </div>

        <Field label="Lien source (optionnel)" name="source_url" type="url" placeholder="https://…" />

        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Niveau de fiabilité</span>
          <select name="trust_level" defaultValue="verifiee" className={inputClass}>
            <option value="verifiee">Vérifiée</option>
            <option value="moderee">À vérifier</option>
            <option value="suspecte">Suspecte</option>
          </select>
        </label>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          {pending ? 'Publication…' : "Publier l'offre"}
        </button>
      </form>
    </div>
  )
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-black/[.1] bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-brand-600/50 focus:outline-none focus:ring-4 focus:ring-brand-600/10 dark:border-white/[.12] dark:bg-zinc-950 dark:text-zinc-50'

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && ' *'}
      </span>
      <input name={name} type={type} required={required} placeholder={placeholder} className={inputClass} />
    </label>
  )
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <select name={name} defaultValue={options[0]} className={inputClass}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}
