import Link from 'next/link'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { OfferCard } from '@/components/OfferCard'
import { SearchBar } from '@/components/SearchBar'
import { createClient } from '@/lib/supabase/server'
import type { SearchOfferRow } from '@/lib/types/database'

export const revalidate = 60

async function getRecentOffers(): Promise<SearchOfferRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('search_offers', { p_limit: 6 })
    if (error) {
      console.error('[accueil] échec du chargement des offres', error)
      return []
    }
    return (data ?? []) as SearchOfferRow[]
  } catch (err) {
    console.error('[accueil] exception chargement offres', err)
    return []
  }
}

// Fallback offers matching Cameroonian economic reality if DB returns 0 offers
const FALLBACK_OFFERS: SearchOfferRow[] = [
  {
    id: 'off-1',
    title: 'Technicien électrotechnique',
    company: 'ENEO Cameroun',
    location: 'Douala',
    contract_type: 'CDI · Formel',
    seniority: 'Junior',
    salary: '180 000 – 250 000 FCFA / mois',
    salary_min: 180000,
    salary_max: 250000,
    deadline: null,
    source: 'ENEO',
    source_url: null,
    sector: 'Énergie / Électricité',
    trust_level: 'verifiee',
    trust_score: 95,
    trust_reasons: ['Entreprise enregistrée'],
    date_posted: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    description: 'Maintenance des installations électriques.',
    requirements: ['BAC+2 Électrotechnique'],
    category: 'officiel',
    rank: 1,
    total_count: 4,
  },
  {
    id: 'off-2',
    title: 'Aide-menuisier',
    company: 'Atelier Nkolbisson',
    location: 'Yaoundé',
    contract_type: 'Journalier · Informel',
    seniority: 'Débutant',
    salary: '3 000 FCFA / jour',
    salary_min: 3000,
    salary_max: 3000,
    deadline: null,
    source: 'Particulier',
    source_url: null,
    sector: 'Artisanat / Bâtiment',
    trust_level: 'verifiee',
    trust_score: 90,
    trust_reasons: ['Offre de proximité'],
    date_posted: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    description: 'Aide à la découpe et assemblage de meubles.',
    requirements: ['Motivation', 'Ponctualité'],
    category: 'informel',
    rank: 2,
    total_count: 4,
  },
  {
    id: 'off-3',
    title: 'Chargé de clientèle',
    company: 'Afriland First Bank',
    location: 'Douala',
    contract_type: 'CDI · Formel',
    seniority: 'Intermédiaire',
    salary: '150 000 FCFA / mois',
    salary_min: 150000,
    salary_max: 150000,
    deadline: null,
    source: 'Afriland',
    source_url: null,
    sector: 'Banque / Finance',
    trust_level: 'verifiee',
    trust_score: 98,
    trust_reasons: ['Entreprise vérifiée'],
    date_posted: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    description: 'Accueil et accompagnement des clients.',
    requirements: ['Licence Banque/Finance'],
    category: 'officiel',
    rank: 3,
    total_count: 4,
  },
  {
    id: 'off-4',
    title: 'Coiffeuse à domicile',
    company: 'Quartier Bonamoussadi',
    location: 'Douala',
    contract_type: 'Prestation · Informel',
    seniority: 'Indépendant',
    salary: '2 500 FCFA / prestation',
    salary_min: 2500,
    salary_max: 2500,
    deadline: null,
    source: 'Annonce locale',
    source_url: null,
    sector: 'Services de proximité',
    trust_level: 'verifiee',
    trust_score: 92,
    trust_reasons: ['Indépendant'],
    date_posted: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    description: 'Prestations de coiffure sur rendez-vous.',
    requirements: ['Expérience en tresses'],
    category: 'informel',
    rank: 4,
    total_count: 4,
  },
]

export default async function HomePage() {
  const dbOffers = await getRecentOffers()
  const offers = dbOffers.length > 0 ? dbOffers : FALLBACK_OFFERS

  return (
    <div className="flex flex-1 flex-col min-h-screen relative overflow-hidden bg-[#FBF7EF]">
      {/* Blobs d'ambiance en arrière-plan */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <Navbar />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="max-w-6xl mx-auto px-6 pt-12 pb-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div>
            <div className="font-mono text-xs tracking-widest uppercase text-[#DB6900] font-medium flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#FF7D00] animate-pulse" />
              412 offres ajoutées cette semaine
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.06] text-[#0C2543] font-serif">
              Il y a un emploi pour toi<br />
              <span className="text-[#FF7D00] italic font-normal relative inline-block">
                quelque part au Cameroun
                <svg className="underline-svg" viewBox="0 0 220 16" preserveAspectRatio="none">
                  <path d="M2 11C40 3 160 3 218 11" />
                </svg>
              </span>.
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#516A82] max-w-lg">
              Neuf actifs sur dix travaillent dans l'informel — et la plupart de ces offres ne sont jamais publiées. KmerJob les recense dans les 10 régions, de Douala à Maroua, de Buea à Bertoua, score ton CV par IA et t'alerte avant que quelqu'un d'autre ne postule.
            </p>

            <SearchBar />

            <div className="mt-5 flex flex-wrap gap-2 text-xs sm:text-sm">
              <Link href="/recherche" className="px-4 py-2 rounded-full border border-[#0C2543] bg-[#0C2543] text-white font-semibold">
                Tous
              </Link>
              <Link href="/recherche?secteur=formel" className="px-4 py-2 rounded-full border border-[#0C2543]/15 text-[#516A82] font-semibold hover:bg-[#0C2543] hover:text-white transition-colors">
                Emplois officiels
              </Link>
              <Link href="/recherche?secteur=informel" className="px-4 py-2 rounded-full border border-[#0C2543]/15 text-[#516A82] font-semibold hover:bg-[#0C2543] hover:text-white transition-colors">
                Petits boulots
              </Link>
              <Link href="/recherche?type=stage" className="px-4 py-2 rounded-full border border-[#0C2543]/15 text-[#516A82] font-semibold hover:bg-[#0C2543] hover:text-white transition-colors">
                Stages
              </Link>
              <Link href="/recherche?type=freelance" className="px-4 py-2 rounded-full border border-[#0C2543]/15 text-[#516A82] font-semibold hover:bg-[#0C2543] hover:text-white transition-colors">
                Freelance
              </Link>
            </div>
          </div>

          {/* VISUEL RADAR INTEL (Signature KmerJob) */}
          <div className="radar-wrap py-6">
            <div className="radar">
              <div className="radar-ring r1" />
              <div className="radar-ring r2" />
              <div className="radar-ring r3" />
              <div className="radar-ring r4" />
              <div className="radar-sweep" />
              <div className="radar-core">
                <svg viewBox="0 0 44 48" fill="none">
                  <path d="M22 1C10.4 1 1 9.9 1 20.9C1 35.6 22 47 22 47C22 47 43 35.6 43 20.9C43 9.9 33.6 1 22 1Z" fill="#FF7D00" />
                  <circle cx="22" cy="19" r="10.5" fill="#0C2543" />
                  <rect x="17.4" y="9.5" width="3.4" height="19" rx="1.2" fill="#FF7D00" />
                  <path d="M20.8 18L28 9.5H32L23.6 19L32 28.5H28L20.8 20V18Z" fill="#FF7D00" />
                </svg>
              </div>
              <div className="blip b1"><span className="blip-dot" /><span className="blip-tag">Comptable · 1.2km</span></div>
              <div className="blip b2"><span className="blip-dot" /><span className="blip-tag">Livreur · 0.6km</span></div>
              <div className="blip b3"><span className="blip-dot" /><span className="blip-tag">Dev Web · 2.4km</span></div>
              <div className="blip b4"><span className="blip-dot" /><span className="blip-tag">Électricien · 0.9km</span></div>
              <div className="absolute -bottom-8 left-0 right-0 text-center font-mono text-xs text-[#516A82]">
                scan en cours autour de toi…
              </div>
            </div>
          </div>
        </section>

        {/* ================= TICKER EN DIRECT ================= */}
        <div className="ticker-wrap">
          <div className="ticker-label">En direct</div>
          <div className="ticker-track">
            <span className="ticker-item"><span className="role">Comptable</span> — SABC <span className="loc">Douala</span></span>
            <span className="ticker-item"><span className="role">Livreur moto</span> — Jumia Food <span className="loc">Yaoundé</span></span>
            <span className="ticker-item"><span className="role">Dev. Web Junior</span> — Startup locale <span className="loc">Douala</span></span>
            <span className="ticker-item"><span className="role">Vendeuse boutique</span> — Marché Mokolo <span className="loc">Yaoundé</span></span>
            <span className="ticker-item"><span className="role">Électricien bâtiment</span> — Chantier Bonapriso <span className="loc">Douala</span></span>
            <span className="ticker-item"><span className="role">Assistant RH</span> — MTN Cameroun <span className="loc">Douala</span></span>
            <span className="ticker-item"><span className="role">Maçon</span> — Chantier privé <span className="loc">Bafoussam</span></span>
            <span className="ticker-item"><span className="role">Comptable</span> — SABC <span className="loc">Douala</span></span>
            <span className="ticker-item"><span className="role">Livreur moto</span> — Jumia Food <span className="loc">Yaoundé</span></span>
            <span className="ticker-item"><span className="role">Dev. Web Junior</span> — Startup locale <span className="loc">Douala</span></span>
            <span className="ticker-item"><span className="role">Vendeuse boutique</span> — Marché Mokolo <span className="loc">Yaoundé</span></span>
            <span className="ticker-item"><span className="role">Électricien bâtiment</span> — Chantier Bonapriso <span className="loc">Douala</span></span>
          </div>
        </div>

        {/* ================= OFFRES DU MOMENT ================= */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
            <h2 className="text-3xl font-serif font-bold text-[#0C2543]">Offres du moment</h2>
            <Link href="/recherche" className="text-sm font-bold text-[#DB6900] border-b-2 border-[#DB6900] pb-0.5 hover:text-[#0C2543] hover:border-[#0C2543] transition-colors">
              Voir toutes les offres →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>

        {/* ================= COMMENT ÇA MARCHE ================= */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-serif font-bold text-[#0C2543] mb-10">Comment ça marche</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="border-t-2 border-[#0C2543] pt-5">
              <span className="font-mono text-xs font-bold text-[#DB6900] uppercase block mb-2">01 — DÉPOSER</span>
              <h3 className="font-serif text-xl font-bold text-[#0C2543] mb-2">Ton CV, en 2 minutes</h3>
              <p className="text-sm text-[#516A82] leading-relaxed">Dépose ton CV ou construis-le directement sur KmerJob, même sans expérience formelle.</p>
            </div>
            <div className="border-t-2 border-[#0C2543] pt-5">
              <span className="font-mono text-xs font-bold text-[#DB6900] uppercase block mb-2">02 — NOTER</span>
              <h3 className="font-serif text-xl font-bold text-[#0C2543] mb-2">Scoring IA instantané</h3>
              <p className="text-sm text-[#516A82] leading-relaxed">Notre IA évalue ton profil et te dit précisément ce qui manque pour décrocher les offres visées.</p>
            </div>
            <div className="border-t-2 border-[#0C2543] pt-5">
              <span className="font-mono text-xs font-bold text-[#DB6900] uppercase block mb-2">03 — ALERTER</span>
              <h3 className="font-serif text-xl font-bold text-[#0C2543] mb-2">Alertes géolocalisées</h3>
              <p className="text-sm text-[#516A82] leading-relaxed">Reçois une notification dès qu'une offre proche de chez toi correspond à ton profil.</p>
            </div>
          </div>
        </section>

        {/* ================= STATS BAND ================= */}
        <div className="bg-[#0C2543] text-white py-16 my-10 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-3 gap-8 text-center relative z-10">
            <div>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#FF7D00]">6 400+</div>
              <div className="text-xs sm:text-sm text-white/70 mt-2">offres actives</div>
            </div>
            <div>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#FF7D00]">1 120</div>
              <div className="text-xs sm:text-sm text-white/70 mt-2">candidats placés</div>
            </div>
            <div>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#FF7D00]">10/10</div>
              <div className="text-xs sm:text-sm text-white/70 mt-2">régions couvertes</div>
            </div>
          </div>
        </div>

        {/* ================= PROOF STRIP ================= */}
        <section className="max-w-6xl mx-auto px-6 py-6">
          <Link href="/guide" className="proof-strip">
            <div className="proof-avatars">
              <span className="proof-avatar">RN</span>
              <span className="proof-avatar">SF</span>
              <span className="proof-avatar">AM</span>
              <span className="proof-avatar">ET</span>
            </div>
            <div className="proof-text">
              <span className="text-[#FF7D00] text-sm">★★★★★</span>
              <span className="font-mono text-xs sm:text-sm">4,8/5 sur 1 240 avis · 1 120 candidats déjà placés</span>
            </div>
            <span className="proof-link text-sm font-bold text-[#DB6900] whitespace-nowrap">Voir leurs histoires →</span>
          </Link>
        </section>

        {/* ================= CTA BLOCK ================= */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="bg-[#F0E9D8] border-[1.5px] border-[#0C2543] rounded-3xl p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0C2543] max-w-xl mx-auto mb-3">
              Pendant que tu hésites, quelqu'un d'autre postule
            </h2>
            <p className="text-[#516A82] text-sm sm:text-base max-w-md mx-auto mb-6">
              Crée ton profil en deux minutes, gratuitement — l'IA cherche pour toi, jour et nuit.
            </p>
            <Link href="/cv" className="inline-block bg-[#FF7D00] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#DB6900] transition-colors shadow-md">
              Créer mon profil
            </Link>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <span className="font-mono text-xs px-3.5 py-1.5 border border-[#0C2543]/15 rounded-full text-[#516A82] bg-white">
                MTN MoMo accepté
              </span>
              <span className="font-mono text-xs px-3.5 py-1.5 border border-[#0C2543]/15 rounded-full text-[#516A82] bg-white">
                Orange Money accepté
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}


