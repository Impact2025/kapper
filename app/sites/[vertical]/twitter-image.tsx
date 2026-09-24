import { renderOgCard, OG_SIZE } from "@/lib/og/card";
import { getVerticalConfig } from "@/lib/verticals";

export const alt = "Social preview";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const { brand } = getVerticalConfig(vertical);
  return renderOgCard({
    eyebrow: "Klus-CRM met AI-receptie",
    title: brand.tagline,
    brand: { name: `${brand.name}.nl`, tagline: brand.tagline },
  });
}
