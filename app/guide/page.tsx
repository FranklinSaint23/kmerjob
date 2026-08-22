import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'

export const metadata = {
  title: 'Témoignages & Guide',
  description: 'Découvrez les témoignages de candidats ayant trouvé un emploi avec KmerJob et le guide étape par étape.',
}

export default function GuidePage() {
  return (
    <div className="flex flex-1 flex-col min-h-screen relative overflow-hidden bg-[#FBF7EF]">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <Navbar />

      <main className="flex-1">
        {/* ================= PAGE HEADER ================= */}
        <div className="max-w-4xl mx-auto px-6 pt-14 pb-4">
          <div className="font-mono text-xs tracking-widest uppercase text-[#DB6900] font-medium flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#FF7D00] animate-pulse" />
            Ils ont trouvé grâce à KmerJob
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#0C2543] leading-tight">
            Des histoires vraies, un mode d'emploi simple.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#516A82] max-w-xl">
            Découvre comment d'autres camerounais ont décroché leur poste, puis suis le guide pour utiliser KmerJob comme un pro.
          </p>
        </div>

        {/* ================= TÉMOIGNAGES ================= */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#0C2543]">Témoignages</h2>
              <div className="font-mono text-xs sm:text-sm text-[#516A82] mt-1 flex items-center gap-2">
                <span className="text-[#FF7D00]">★★★★★</span>
                <span><b>1 240</b> avis vérifiés · 4,8/5</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="bg-white border-[1.5px] border-[#0C2543] rounded-2xl p-6 flex flex-col justify-between hover:shadow-[6px_8px_0_#0C2543] transition-all hover:-translate-y-1">
              <div>
                <div className="text-[#FF7D00] text-sm mb-3">★★★★★</div>
                <p className="text-sm sm:text-base leading-relaxed text-[#0C2543]">
                  "Mon score IA est passé de 54 à 88 en une semaine grâce aux corrections suggérées. Embauchée chez ENEO 12 jours après mon inscription."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-[#0C2543] text-white flex items-center justify-center font-serif font-bold text-sm">
                  RN
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0C2543]">Rosine N.</div>
                  <div className="text-xs text-[#516A82]">Technicienne, Douala</div>
                </div>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#0C2543] rounded-2xl p-6 flex flex-col justify-between hover:shadow-[6px_8px_0_#0C2543] transition-all hover:-translate-y-1">
              <div>
                <div className="text-[#FF7D00] text-sm mb-3">★★★★★</div>
                <p className="text-sm sm:text-base leading-relaxed text-[#0C2543]">
                  "Une alerte pour un poste à 700 mètres de chez moi. Entretien 48h après, je n'ai postulé qu'une seule fois."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-[#0C2543] text-white flex items-center justify-center font-serif font-bold text-sm">
                  SF
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0C2543]">Samuel F.</div>
                  <div className="text-xs text-[#516A82]">Chargé de clientèle, Yaoundé</div>
                </div>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#0C2543] rounded-2xl p-6 flex flex-col justify-between hover:shadow-[6px_8px_0_#0C2543] transition-all hover:-translate-y-1">
              <div>
                <div className="text-[#FF7D00] text-sm mb-3">★★★★☆</div>
                <p className="text-sm sm:text-base leading-relaxed text-[#0C2543]">
                  "3 clientes régulières trouvées dès la première semaine, sans passer par une agence ni payer de commission."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-[#0C2543] text-white flex items-center justify-center font-serif font-bold text-sm">
                  AM
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0C2543]">Aïcha M.</div>
                  <div className="text-xs text-[#516A82]">Coiffeuse indépendante, Douala</div>
                </div>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#0C2543] rounded-2xl p-6 flex flex-col justify-between hover:shadow-[6px_8px_0_#0C2543] transition-all hover:-translate-y-1">
              <div>
                <div className="text-[#FF7D00] text-sm mb-3">★★★★★</div>
                <p className="text-sm sm:text-base leading-relaxed text-[#0C2543]">
                  "Je pensais que c'était réservé à Douala et Yaoundé. J'ai reçu une alerte à 4 km de chez moi à Bamenda — embauché en 3 semaines."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-[#0C2543] text-white flex items-center justify-center font-serif font-bold text-sm">
                  ET
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0C2543]">Emmanuel T.</div>
                  <div className="text-xs text-[#516A82]">Agent logistique, Bamenda</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= GUIDE ÉTAPE PAR ÉTAPE ================= */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-serif font-bold text-[#0C2543] mb-8">Le guide, étape par étape</h2>
          <div className="border-t-[1.5px] border-[#0C2543]">
            <div className="grid sm:grid-cols-[70px_1fr] gap-4 py-6 border-b border-[#0C2543]/15 items-start transition-all hover:pl-2">
              <div className="font-mono text-sm font-bold text-[#DB6900]">01</div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0C2543] mb-1">Crée ton profil</h3>
                <p className="text-sm text-[#516A82] leading-relaxed max-w-xl">
                  Renseigne ton métier, ta ville et tes disponibilités. Deux minutes suffisent, même depuis un petit téléphone.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-[70px_1fr] gap-4 py-6 border-b border-[#0C2543]/15 items-start transition-all hover:pl-2">
              <div className="font-mono text-sm font-bold text-[#DB6900]">02</div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0C2543] mb-1">Dépose ou construis ton CV</h3>
                <p className="text-sm text-[#516A82] leading-relaxed max-w-xl">
                  Importe un CV existant en photo ou PDF, ou laisse KmerJob t'aider à en créer un à partir de tes réponses.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-[70px_1fr] gap-4 py-6 border-b border-[#0C2543]/15 items-start transition-all hover:pl-2">
              <div className="font-mono text-sm font-bold text-[#DB6900]">03</div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0C2543] mb-1">Consulte ton score IA</h3>
                <p className="text-sm text-[#516A82] leading-relaxed max-w-xl">
                  KmerJob analyse ton profil et t'indique concrètement ce qui te ferait gagner des points face aux recruteurs.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-[70px_1fr] gap-4 py-6 border-b border-[#0C2543]/15 items-start transition-all hover:pl-2">
              <div className="font-mono text-sm font-bold text-[#DB6900]">04</div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0C2543] mb-1">Active les alertes</h3>
                <p className="text-sm text-[#516A82] leading-relaxed max-w-xl">
                  Choisis un rayon autour de chez toi : dès qu'une offre correspond, tu reçois une notification immédiate.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-[70px_1fr] gap-4 py-6 border-b border-[#0C2543]/15 items-start transition-all hover:pl-2">
              <div className="font-mono text-sm font-bold text-[#DB6900]">05</div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0C2543] mb-1">Postule en un geste</h3>
                <p className="text-sm text-[#516A82] leading-relaxed max-w-xl">
                  Ton profil est déjà prêt — envoie ta candidature directement depuis l'offre, sans ressaisir d'informations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= KMERJOB PREMIUM ================= */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-[#0C2543] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden border border-white/10">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF7D00] font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF7D00]" />
              KmerJob Premium
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold max-w-xl mb-4 leading-snug">
              Les candidats Premium sont vus en premier — et le savent avant tout le monde.
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-xl mb-8 leading-relaxed">
              Chaque jour d'attente, c'est une offre qui part à quelqu'un d'autre. Premium met ton profil devant les recruteurs et ton téléphone en alerte avant la concurrence.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <span className="font-mono text-[10px] text-[#FF7D00] uppercase tracking-wider block mb-1">Priorité</span>
                <h3 className="font-serif text-base font-bold mb-1">Alertes 2h avant tout le monde</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Les membres Premium reçoivent les nouvelles offres en avant-première, avant qu'elles ne soient noyées sous les candidatures.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <span className="font-mono text-[10px] text-[#FF7D00] uppercase tracking-wider block mb-1">Visibilité</span>
                <h3 className="font-serif text-base font-bold mb-1">Profil mis en avant</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Ton CV apparaît en tête des résultats recruteurs — jusqu'à 4× plus de vues qu'un profil standard.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <span className="font-mono text-[10px] text-[#FF7D00] uppercase tracking-wider block mb-1">Rayon élargi</span>
                <h3 className="font-serif text-base font-bold mb-1">Géolocalisation étendue</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Couvre toute ta région, pas seulement ton quartier, et ne rate plus aucune opportunité proche de toi.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <span className="font-mono text-[10px] text-[#FF7D00] uppercase tracking-wider block mb-1">Illimité</span>
                <h3 className="font-serif text-base font-bold mb-1">Candidatures sans limite</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Postule à autant d'offres que tu veux, chaque jour, sans quota — la version gratuite en limite le nombre.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/premium" className="bg-[#FF7D00] text-white font-bold px-7 py-3 rounded-xl hover:bg-[#DB6900] transition-colors shadow-md">
                Passer à Premium
              </Link>
              <span className="font-mono text-xs text-white/60">
                à partir de <b className="text-white text-sm">500 FCFA</b> / semaine · paiement MoMo ou Orange Money
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
