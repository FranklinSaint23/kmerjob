/**
 * Monogramme KmerJob : un K dont la branche inférieure se prolonge en coche,
 * pour rappeler la vérification des annonces. Source unique du tracé —
 * réutilisée par Navbar et Footer. (app/icon.svg est un fichier statique
 * séparé, dupliqué une fois : la convention de fichiers de Next.js pour le
 * favicon ne peut pas importer un composant React.)
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-label="KmerJob">
      <defs>
        <linearGradient id="logoMarkGradient" x1="4" y1="4" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="88" height="88" rx="20" fill="url(#logoMarkGradient)" />
      <path
        d="M30,20 L30,76 M30,44 L78,18 M30,50 L46,68 L78,30"
        fill="none"
        stroke="#ffffff"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
