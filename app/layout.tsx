import type { Metadata } from "next";
import "./globals.css";

import { ChatWidget } from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "KmerJob — L'emploi camerounais, sans détour",
    template: "%s · KmerJob",
  },
  description:
    "Plateforme camerounaise de recherche d'emploi — centralise les offres officielles et informelles sur l'ensemble des 10 régions du Cameroun.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FBF7EF] text-[#0C2543]">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}

