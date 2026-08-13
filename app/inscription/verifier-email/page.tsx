import { MailCheck } from 'lucide-react'

export default function VerifierEmailPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 text-center dark:bg-black">
      <div>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <MailCheck className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Vérifie ta boîte mail
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Un lien de confirmation vient de t&apos;être envoyé. Clique dessus pour
          activer ton compte, puis reviens te connecter.
        </p>
      </div>
    </div>
  )
}
