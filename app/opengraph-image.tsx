import { renderOgCard, OG_SIZE } from "@/lib/og/card";

export const alt = "KapperAssistent.nl — Focus op je vak, niet op de telefoon";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgCard({
    eyebrow: "AI-receptie voor kapsalons",
    title: "Nooit meer een gemiste boeking",
  });
}
