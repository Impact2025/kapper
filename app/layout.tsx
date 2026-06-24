import type { Metadata } from "next";
import { EB_Garamond, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kappersassistent.nl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KapperAssistent.nl — Focus op je vak, niet op de telefoon",
    template: "%s — KapperAssistent.nl",
  },
  description:
    "De AI-gedreven operationele cockpit voor de moderne kapsalon. Je AI-assistent neemt op via WhatsApp en telefoon, direct gekoppeld aan je agenda. Nooit meer gemiste boekingen.",
  keywords: [
    "kapper AI assistent",
    "kapsalon telefoon AI",
    "salon afspraken AI",
    "no-show reductie kapper",
    "kapsalon software",
  ],
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: siteUrl,
    siteName: "KapperAssistent.nl",
    title: "KapperAssistent.nl — Focus op je vak, niet op de telefoon",
    description:
      "Je AI-receptioniste neemt 24/7 op via telefoon en WhatsApp, gekoppeld aan je agenda. Meer boekingen, minder no-shows, meer rust.",
  },
  twitter: {
    card: "summary_large_image",
    title: "KapperAssistent.nl",
    description:
      "De AI-gedreven operationele cockpit voor de moderne kapsalon.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${garamond.variable} ${hanken.variable} light h-full`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-body-md text-body-md">
        {children}
      </body>
    </html>
  );
}
