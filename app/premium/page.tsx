import { Bell, Check, Radar, Target } from 'lucide-react'
import Link from 'next/link'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { PREMIUM_PLAN } from '@/lib/subscription'

const BENEFITS = [
  "Alertes 2h avant tout le monde : reçois les nouvelles offres en avant-première",
  "Profil mis en avant : jusqu'à 4× plus de vues par les recruteurs",
  "Rayon élargi : géolocalisation étendue à l'échelle de toute ta région",
  "Candidatures illimitées : postule à autant d'offres que tu veux sans aucune limite",
]

export default function PremiumPage() {
  return (
    <div className="flex flex-1 flex-col min-h-screen bg-[#FBF7EF] text-[#0C2543]">
      <Navbar />

      <main className="flex-1">
        <section className="bg-[#0C2543] text-white py-16 px-6 text-center border-b border-white/10">
          <div className="max-w-3xl mx-auto">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF7D00] text-white shadow-lg">
              <Radar className="h-6 w-6" strokeWidth={2} />
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-serif font-bold text-white">
              KmerJob Premium
            </h1>
            <p className="mt-3 text-base text-white/70 max-w-lg mx-auto leading-relaxed">
              Les candidats Premium sont vus en premier — et le savent avant tout le monde. Reçois les annonces en priorité sur ton téléphone.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-14">
          <div className="rounded-3xl border-[1.5px] border-[#0C2543] bg-white p-8 sm:p-10 shadow-[6px_8px_0_#0C2543]">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#0C2543]/15 pb-6">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#FF7D00]">Abonnement Candidat</p>
                <p className="mt-1 font-serif text-3xl sm:text-4xl font-bold text-[#0C2543]">
                  {PREMIUM_PLAN.amountXaf.toLocaleString('fr-FR')} FCFA
                  <span className="font-mono text-sm font-normal text-[#516A82]"> / {PREMIUM_PLAN.durationDays} jours</span>
                </p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full border border-[#0C2543]/15 bg-[#F0E9D8] px-3 py-1 font-mono text-xs text-[#0C2543] font-semibold">
                  MTN MoMo
                </span>
                <span className="rounded-full border border-[#0C2543]/15 bg-[#F0E9D8] px-3 py-1 font-mono text-xs text-[#0C2543] font-semibold">
                  Orange Money
                </span>
              </div>
            </div>

            <ul className="mt-6 space-y-4">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm sm:text-base text-[#0C2543]">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-[#FF7D00]" strokeWidth={2.5} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/premium/paiement"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF7D00] px-6 py-4 text-base font-bold text-white shadow-md hover:bg-[#DB6900] transition-colors"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              Activer mon abonnement Premium
            </Link>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#0C2543]/15 bg-[#F0E9D8]/60 p-5 text-sm text-[#516A82]">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-[#DB6900]" strokeWidth={2} />
            Le Radar géolocalisé s'appuie sur ton profil et ton CV. Tu peux créer ou analyser ton CV depuis{' '}
            <Link href="/cv" className="font-bold text-[#0C2543] underline hover:text-[#FF7D00]">
              la page d'analyse CV
            </Link>.
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

