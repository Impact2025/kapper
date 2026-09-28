import { Fraunces, Quicksand } from "next/font/google";
import Link from "next/link";

// Ronde, ruim gespatieerde kop + rustige serif voor de lopende tekst: de
// "filmische" hero-stijl (volle video, donkere gradient, pill-knoppen).
const display = Quicksand({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-cine-display", display: "swap" });
const serif = Fraunces({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-cine-serif", display: "swap" });

export interface CinematicHeroProps {
  eyebrow: string;
  headline: string;
  sub: string;
  video: { src: string; poster: string; label: string };
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  /** Accent for the headline and primary button, e.g. warm zonlicht-geel. */
  accent?: string;
}

/**
 * Full-bleed video hero. The video is decorative (muted, looping, no controls);
 * with prefers-reduced-motion or before it loads, the poster stays visible.
 */
export function CinematicHero({ eyebrow, headline, sub, video, primary, secondary, accent = "#f1d675" }: CinematicHeroProps) {
  return (
    <section
      className={`${display.variable} ${serif.variable} relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden bg-[#0c1f14] text-white`}
      aria-label={video.label}
    >
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover motion-reduce:hidden"
        src={video.src}
        poster={video.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      {/* Poster als vaste achtergrond voor reduced-motion. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={video.poster} alt="" className="absolute inset-0 -z-20 hidden h-full w-full object-cover motion-reduce:block" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0c1f14] via-[#0c1f14]/70 to-[#0c1f14]/25" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0c1f14]/70 via-transparent to-transparent" aria-hidden="true" />

      <div className="mx-auto w-full max-w-container-max px-margin-mobile pb-xl pt-xl md:px-xl md:pb-xl">
        <p className="mb-md font-[family-name:var(--font-cine-display)] text-[15px] font-medium lowercase tracking-[0.22em] text-white/90 md:text-lg">
          {eyebrow}
        </p>
        <h1
          className="mb-lg max-w-[16ch] font-[family-name:var(--font-cine-display)] text-[clamp(2.75rem,9vw,6.5rem)] font-medium lowercase leading-[1.02] tracking-[0.06em]"
          style={{ color: accent }}
        >
          {headline}
        </h1>
        <p className="mb-xl max-w-[38rem] font-[family-name:var(--font-cine-serif)] text-lg leading-relaxed text-white/90 md:text-2xl md:leading-[1.5]">
          {sub}
        </p>
        <div className="flex flex-col gap-sm sm:flex-row">
          <Link
            href={primary.href}
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-[family-name:var(--font-cine-serif)] text-lg text-[#0c1f14] transition hover:brightness-95 active:scale-95"
            style={{ backgroundColor: accent }}
          >
            {primary.label} <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={secondary.href}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 px-8 py-4 font-[family-name:var(--font-cine-serif)] text-lg text-white transition hover:bg-white/10 active:scale-95"
          >
            {secondary.label} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
