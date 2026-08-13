import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'

import type { TrustLevel } from '@/lib/types/database'

const STYLES: Record<
  TrustLevel,
  { label: string; className: string; icon: typeof ShieldCheck }
> = {
  verifiee: {
    label: 'Vérifiée',
    className:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
    icon: ShieldCheck,
  },
  moderee: {
    label: 'À vérifier',
    className:
      'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
    icon: ShieldQuestion,
  },
  suspecte: {
    label: 'Suspecte',
    className:
      'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
    icon: ShieldAlert,
  },
}

/**
 * Badge de fiabilité. `title` porte les raisons pour rester consultable sans
 * script (l'infobulle native du navigateur) — ce badge protège les gens contre
 * des arnaques, il doit rester lisible même si le JS échoue.
 */
export function TrustBadge({
  level,
  reasons,
  className = '',
}: {
  level: TrustLevel
  reasons?: string[]
  className?: string
}) {
  const { label, className: style, icon: Icon } = STYLES[level]
  return (
    <span
      title={reasons?.join(' ')}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </span>
  )
}
