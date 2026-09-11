import { ImageResponse } from "next/og";
import { loadLogoDataUrl, loadOgFonts } from "./font";

export const OG_SIZE = { width: 1200, height: 630 };

export async function renderOgCard({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const [logoSrc, fonts] = await Promise.all([loadLogoDataUrl(), loadOgFonts(title)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #3b4b39 0%, #526350 55%, #8d4d38 130%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={64} height={64} style={{ objectFit: "contain" }} />
          <span
            style={{
              fontFamily: "Hanken Grotesk",
              fontWeight: 700,
              fontSize: "30px",
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}
          >
            KapperAssistent.nl
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "980px" }}>
          <span
            style={{
              fontFamily: "Hanken Grotesk",
              fontWeight: 700,
              fontSize: "22px",
              letterSpacing: "0.08em",
              color: "#ffdbd0",
            }}
          >
            {eyebrow.toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: "EB Garamond",
              fontWeight: 600,
              fontSize: title.length > 60 ? "52px" : "64px",
              lineHeight: 1.15,
              color: "#ffffff",
            }}
          >
            {title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "56px", height: "6px", borderRadius: "9999px", background: "#fdaa8f" }} />
          <span
            style={{
              fontFamily: "Hanken Grotesk",
              fontWeight: 700,
              fontSize: "20px",
              color: "#d5e8cf",
            }}
          >
            Focus op je vak, niet op de telefoon
          </span>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
