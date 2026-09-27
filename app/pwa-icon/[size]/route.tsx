import { ImageResponse } from "next/og";
import { loadLogoDataUrl } from "@/lib/og/font";

const SIZES = new Set([192, 512]);

export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  // Maskable: Android snijdt tot 20% rondom af, dus het logo krijgt extra marge.
  const maskable = new URL(req.url).searchParams.get("maskable") === "1";
  const logo = Math.round(size * (maskable ? 0.5 : 0.7));
  const logoSrc = await loadLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#526350",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={logo} height={logo} style={{ objectFit: "contain" }} />
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
