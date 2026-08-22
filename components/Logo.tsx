import Link from 'next/link'

/**
 * Logo KmerJob Officiel (Cahier des charges & charte graphique) :
 * Pictogramme en forme de repère de localisation (pin) orange (#FF7D00),
 * avec anneau bleu marine (#0C2543) et 'K' stylisé en négatif.
 */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center shrink-0 rounded-[11px] bg-[#0C2543] p-1.5 shadow-sm ${className}`}>
      <svg width="26" height="28" viewBox="0 0 44 48" fill="none">
        <path d="M22 1C10.4 1 1 9.9 1 20.9C1 35.6 22 47 22 47C22 47 43 35.6 43 20.9C43 9.9 33.6 1 22 1Z" fill="#FF7D00" />
        <circle cx="22" cy="19" r="10.5" fill="#0C2543" />
        <rect x="17.4" y="9.5" width="3.4" height="19" rx="1.2" fill="#FF7D00" />
        <path d="M20.8 18L28 9.5H32L23.6 19L32 28.5H28L20.8 20V18Z" fill="#FF7D00" />
      </svg>
    </div>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-serif font-bold text-xl tracking-tight text-[#0C2543]">
        KMER<span className="text-[#FF7D00] italic">JOB</span>
      </span>
    </Link>
  )
}

