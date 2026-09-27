import type { Metadata, Viewport } from "next";
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

// Mobiel: safe-area (notch/home-indicator) beschikbaar maken via viewport-fit=cover,
// en het toetsenbord het layout-viewport laten verkleinen (Android Chrome) zodat
// vaste chat-/formulierbalken niet achter het toetsenbord verdwijnen.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#fbf9f8",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kappersassistent.nl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KapperAssistent.nl — Focus op je vak, niet op de telefoon",
    template: "%s — KapperAssistent.nl",
  },
  description:
    "De AI-gedreven operationele cockpit voor de moderne kapsalon. Je AI-assistent neemt op via WhatsApp en telefoon, direct gekoppeld aan je agenda. Nooit meer gemiste boekingen.",
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
  applicationName: "KapperAssistent",
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: "KapperAssistent", statusBarStyle: "default" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        <link rel="preload" href="/fonts/material-symbols-subset.woff2?v=2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col font-body-md text-body-md">
        {children}
      </body>
    </html>
  );
}
