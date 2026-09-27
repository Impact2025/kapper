import type { MetadataRoute } from "next";

/** Installeerbaar op Android ("Toevoegen aan startscherm") en iOS (Deel → Zet op beginscherm). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KapperAssistent",
    short_name: "KapperAssistent",
    description: "Je AI-assistent voor telefoon, WhatsApp en agenda.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "nl",
    background_color: "#fbf9f8",
    theme_color: "#fbf9f8",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
