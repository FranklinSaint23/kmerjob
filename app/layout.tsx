import type { Metadata } from "next";
import "./globals.css";

import { ChatWidget } from "@/components/chat/ChatWidget";

/*
 * Pas de next/font/google ici.
 *
 * next/font télécharge les fichiers de police depuis fonts.gstatic.com pendant
 * la compilation : le build échoue dès que ce domaine est injoignable (réseau
 * restreint, CI hors ligne, coupure côté Google). Surtout, KmerJob s'adresse à
 * des utilisateurs souvent en données mobiles limitées — une pile de polices
 * système s'affiche immédiatement, sans un octet téléchargé et sans décalage
 * de mise en page au chargement.
 *
 * Si une police de marque devient nécessaire, la bonne voie est next/font/local
 * avec les .woff2 versionnés dans le dépôt : même bénéfice de self-hosting,
 * sans dépendance réseau au moment du build.
 */

export const metadata: Metadata = {
  title: {
    default: "KmerJob — Trouvez un emploi au Cameroun",
    template: "%s · KmerJob",
  },
  description:
    "Offres d'emploi au Cameroun, analyse de votre CV et détection des annonces frauduleuses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
