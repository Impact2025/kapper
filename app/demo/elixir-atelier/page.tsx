import type { Metadata } from "next";
import Link from "next/link";
import { ElixirChatWidget } from "@/components/demo/elixir-chat-widget";

export const metadata: Metadata = {
  title: "Élixir Atelier — Live demo",
  robots: { index: false, follow: false },
};

const fontFamily = "'Plus Jakarta Sans', ui-sans-serif, sans-serif";
const display = "font-['Playfair_Display']";

export default function ElixirAtelierPage() {
  return (
    <div style={{ fontFamily }} className="bg-[#fbf9f5] text-[#1b1c1a]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Demo banner */}
      <div className="bg-[#1b1c1a] px-6 py-2 text-center">
        <p className="text-[12px] text-white/70">
          Live demo van KapperAssistent — dit is een fictieve salon.{" "}
          <Link href="/" className="text-[#e0c298] underline">Terug naar KapperAssistent.nl</Link>
        </p>
      </div>

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-[#1b1c1a]/[0.06] bg-[#fbf9f5]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <a href="#top" className="flex items-baseline gap-3">
            <span className={`${display} text-2xl font-semibold tracking-tight text-[#1b1c1a]`}>Élixir Atelier</span>
            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-[#725b38] sm:inline">Maison de Beauté</span>
          </a>
          <nav className="hidden items-center gap-1 rounded-full border border-[#1b1c1a]/[0.06] bg-white/60 p-1 lg:flex">
            <a href="#behandelingen" className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#4d4540] hover:text-[#1b1c1a]">Behandelingen</a>
            <a href="#stylisten" className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#4d4540] hover:text-[#1b1c1a]">Stylisten</a>
            <a href="#top" className="rounded-full bg-[#efeeea] px-4 py-2 text-[13.5px] font-medium text-[#1b1c1a]">Het Atelier</a>
            <a href="#filosofie" className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#4d4540] hover:text-[#1b1c1a]">Filosofie</a>
            <a href="#locatie" className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#4d4540] hover:text-[#1b1c1a]">Het Atelier &amp; U</a>
          </nav>
          <a href="#boeken" className="hidden items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.03] sm:inline-flex">
            Boek Afspraak
            <span className="material-symbols-outlined !text-[16px]">north_east</span>
          </a>
        </div>
      </header>

      <main id="top">
        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden pb-24 pt-16 sm:pt-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#725b38]">
                Maison de Haute Coiffure • Amsterdam Oud-Zuid
              </p>
              <h1 className={`${display} mt-5 text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-[#1b1c1a] sm:text-6xl lg:text-[4.25rem]`} style={{ textWrap: "balance" }}>
                Haarkunst &amp; <em className={`${display} not-italic italic text-[#725b38]`}>Zuivere Schoonheid</em> in Harmonie
              </h1>
              <p className="mx-auto mt-6 max-w-[36rem] text-[15.5px] leading-relaxed text-[#4d4540]">
                Aan de statige Willemsparkweg vindt u een herenhuis gewijd aan rust, botanische
                verzorging en vakmanschap zonder compromis. Elke behandeling bij Élixir Atelier is
                een rituaal — nooit gehaast, altijd op maat van uw haar en uw huid.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href="#boeken" className="group inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-4px_rgba(28,24,21,0.24)] transition-transform hover:scale-[1.03]">
                  Direct Afspraak Boeken
                  <span className="material-symbols-outlined !text-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">north_east</span>
                </a>
                <a href="#behandelingen" className="inline-flex items-center gap-2 rounded-full border border-[#1b1c1a]/[0.12] bg-white px-7 py-3.5 text-sm font-semibold text-[#1b1c1a] hover:border-[#1b1c1a]/[0.28]">
                  Ontdek Onze Behandelingen
                </a>
              </div>
            </div>

            <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-5">
              <div className="group relative col-span-1 h-[280px] overflow-hidden rounded-3xl sm:col-span-3 sm:h-[420px]">
                <div className="absolute inset-0 scale-105 bg-gradient-to-br from-[#2b241d] via-[#4a3c2c] to-[#8a6f4c] transition-transform duration-700 group-hover:scale-110"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0"></div>
                <span className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
                  <span className="material-symbols-outlined !text-[20px]">location_on</span>
                </span>
                <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 backdrop-blur-sm">
                  <p className="text-[12px] font-semibold text-[#1b1c1a]">Willemsparkweg 84</p>
                </div>
              </div>
              <div className="col-span-1 grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-1 sm:gap-5">
                <div className="group relative h-[130px] overflow-hidden rounded-3xl sm:h-[200px]">
                  <div className="absolute inset-0 scale-105 bg-gradient-to-br from-[#e7d6b8] via-[#d9bd8e] to-[#b6976f] transition-transform duration-700 group-hover:scale-110"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className={`${display} text-[13px] italic text-white/95`}>Bespoke Elixirs</p>
                    <p className="text-[10.5px] uppercase tracking-[0.12em] text-white/75">100% Zuivere Essenties</p>
                  </div>
                </div>
                <div className="group relative h-[130px] overflow-hidden rounded-3xl sm:h-[200px]">
                  <div className="absolute inset-0 scale-105 bg-gradient-to-br from-[#1b1c1a] via-[#32302c] to-[#5a5148] transition-transform duration-700 group-hover:scale-110"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className={`${display} text-[13px] italic text-white/95`}>Artisanaal Handwerk</p>
                    <p className="text-[10.5px] uppercase tracking-[0.12em] text-white/75">Japans Staal &amp; Textuur</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating quick booking bar */}
          <div id="boeken" className="mx-auto -mb-20 mt-10 max-w-5xl px-6 lg:px-10">
            <div className="rounded-3xl border border-[#1b1c1a]/[0.06] bg-white p-3 shadow-[0_24px_60px_-16px_rgba(28,24,21,0.18)] sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-2 sm:divide-x sm:divide-[#1b1c1a]/[0.07]">
                <label className="flex flex-col gap-1 px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4d4540]">Behandeling</span>
                  <select className="w-full appearance-none bg-transparent text-[14.5px] font-medium text-[#1b1c1a] outline-none">
                    <option>Bespoke Balayage &amp; Toning</option>
                    <option>Signature Haircut &amp; Sculpting</option>
                    <option>Botanical Glossing &amp; Repair Ritual</option>
                    <option>Couture Updo &amp; Event Styling</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4d4540]">Stylist</span>
                  <select className="w-full appearance-none bg-transparent text-[14.5px] font-medium text-[#1b1c1a] outline-none">
                    <option>Geen voorkeur</option>
                    <option>Elena Vance</option>
                    <option>Julian de Vries</option>
                    <option>Chloé Laurent</option>
                    <option>Lucas Moreau</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4d4540]">Datum</span>
                  <input type="date" className="w-full bg-transparent text-[14.5px] font-medium text-[#1b1c1a] outline-none" />
                </label>
                <div className="flex items-end px-1.5 py-1.5">
                  <a href="#chat-hint" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C5A880] to-[#B6976F] px-4 py-3.5 text-[13.5px] font-semibold text-white shadow-[0_10px_20px_-8px_rgba(114,91,56,0.55)] transition-transform hover:scale-[1.02]">
                    <span className="material-symbols-outlined !text-[18px]">search</span>
                    Zoek Beschikbaarheid
                  </a>
                </div>
              </div>
              <p id="chat-hint" className="mt-3 text-center text-[12px] text-[#4d4540]">
                Gebruik de chat rechtsonder — onze AI-receptioniste boekt live in de echte agenda.
              </p>
            </div>
          </div>
        </section>

        {/* ================= FILOSOFIE ================= */}
        <section id="filosofie" className="bg-[#f5f3ef] pb-24 pt-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#725b38]">Onze Filosofie</p>
              <h2 className={`${display} mt-4 text-4xl font-semibold tracking-tight text-[#1b1c1a] sm:text-[2.75rem]`} style={{ textWrap: "balance" }}>Puurheid, Passie &amp; Privacy</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#4d4540]">
                Drie principes dragen alles wat wij doen — van de formules op onze planken tot de
                stilte in onze behandelkamers.
              </p>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-3xl bg-white p-8 shadow-[0_8px_24px_-4px_rgba(28,24,21,0.04)]">
                <span className={`${display} text-sm italic text-[#725b38]`}>01</span>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fedeb2] text-[#725b38]">
                  <span className="material-symbols-outlined">eco</span>
                </div>
                <h3 className={`${display} mt-5 text-xl font-semibold text-[#1b1c1a]`}>Duurzaam &amp; Ethisch</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#4d4540]">
                  100% botanisch &amp; zuiver — elke formule draagt onze Clean Beauty-certificering,
                  vrij van sulfaten, parabenen en dierproeven.
                </p>
              </div>
              <div className="rounded-3xl bg-white p-8 shadow-[0_8px_24px_-4px_rgba(28,24,21,0.04)]">
                <span className={`${display} text-sm italic text-[#725b38]`}>02</span>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fedeb2] text-[#725b38]">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <h3 className={`${display} mt-5 text-xl font-semibold text-[#1b1c1a]`}>Haute Expertise</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#4d4540]">
                  Meester-stylisten &amp; coloristen, opgeleid in Parijs en Londen — elk met een
                  persoonlijk kleurenprofiel voor uw unieke ondertoon.
                </p>
              </div>
              <div className="rounded-3xl bg-white p-8 shadow-[0_8px_24px_-4px_rgba(28,24,21,0.04)]">
                <span className={`${display} text-sm italic text-[#725b38]`}>03</span>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fedeb2] text-[#725b38]">
                  <span className="material-symbols-outlined">spa</span>
                </div>
                <h3 className={`${display} mt-5 text-xl font-semibold text-[#1b1c1a]`}>Serene Retraite</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#4d4540]">
                  Holistische behandelkamers en private suites — een toevluchtsoord waar de stad
                  achter u blijft bij binnenkomst.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= COUTURE MENU ================= */}
        <section id="behandelingen" className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#725b38]">Het Couture Menu</p>
              <h2 className={`${display} mt-4 text-4xl font-semibold tracking-tight text-[#1b1c1a] sm:text-[2.75rem]`} style={{ textWrap: "balance" }}>Signature Behandelingen</h2>
              <p className="mt-4 text-[14px] text-[#4d4540]">Boek direct via de chat rechtsonder — dezelfde AI die hier antwoordt, boekt live in onze echte agenda.</p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {[
                { name: "Bespoke Balayage & Toning", price: "160", duration: "120", icon: "spa", features: ["Kleuranalyse op maat van uw huidondertoon", "Bonding-behandeling ter bescherming van de haarvezel", "Handgemixte tint, uniek per klant", "Botanische glansverzegeling inbegrepen"] },
                { name: "Signature Haircut & Sculpting", price: "65", duration: "45", icon: "content_cut", features: ["Consult over vorm, gelaatslijn en levensstijl", "Knipwerk met Japans staal voor zuivere lijnen", "Styling & föhnafwerking op maat", "Thuisverzorgingsadvies inbegrepen"] },
                { name: "Botanical Glossing & Repair Ritual", price: "45", duration: "30", icon: "water_drop", features: ["Botanisch glansritueel met kruidenoliën", "Diepe voeding voor broos of gekleurd haar", "Hoofdhuidmassage van 10 minuten", "Zichtbare glans zonder verzwaring"] },
                { name: "Couture Updo & Event Styling", price: "85", duration: "60", icon: "celebration", features: ["Op maat gemaakt voor bruiloften & gala's", "Proefsessie mogelijk voorafgaand aan het event", "Langdurige fixatie zonder stijve afwerking", "Sieraden & bloemwerk op aanvraag verwerkt"] },
              ].map((t) => (
                <article key={t.name} className="group flex flex-col justify-between rounded-3xl border border-[#1b1c1a]/[0.06] bg-white p-8 transition-shadow hover:shadow-[0_16px_40px_-12px_rgba(28,24,21,0.12)]">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className={`${display} text-2xl font-semibold text-[#1b1c1a]`}>{t.name}</h3>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#1b1c1a]/[0.1] text-[#1b1c1a] transition-colors group-hover:border-[#725b38] group-hover:bg-[#725b38] group-hover:text-white">
                        <span className="material-symbols-outlined !text-[20px]">add</span>
                      </span>
                    </div>
                    <p className="mt-2 text-[13.5px] font-medium text-[#4d4540]">€ {t.price} &nbsp;•&nbsp; {t.duration} minuten</p>
                    <ul className="mt-5 space-y-2.5">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13.5px] text-[#4d4540]">
                          <span className="material-symbols-outlined mt-0.5 !text-[16px] text-[#725b38]">{t.icon}</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= STYLISTEN ================= */}
        <section id="stylisten" className="bg-[#f5f3ef] py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#725b38]">Het Atelier Team</p>
              <h2 className={`${display} mt-4 text-4xl font-semibold tracking-tight text-[#1b1c1a] sm:text-[2.75rem]`} style={{ textWrap: "balance" }}>Onze Meesters van het Vak</h2>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { initials: "EV", name: "Elena Vance", role: "Creative Director", sub: "Master Colorist — Parijs", rating: "5.0", from: "#eadfcb", to: "#c8a877" },
                { initials: "JV", name: "Julian de Vries", role: "Senior Hair Sculptor", sub: "Precisiesnitten — Londen", rating: "4.9", from: "#3c3630", to: "#171613" },
                { initials: "CL", name: "Chloé Laurent", role: "Botanical Ritual Specialist", sub: "Huidrituelen — Milaan", rating: "5.0", from: "#f2e2c8", to: "#d8b98d" },
                { initials: "LM", name: "Lucas Moreau", role: "Master Stylist", sub: "Texturist — Antwerpen", rating: "4.9", from: "#8a6f4c", to: "#4a3c2c" },
              ].map((s) => (
                <article key={s.name} className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_-4px_rgba(28,24,21,0.04)]">
                  <div className="relative h-56" style={{ background: `linear-gradient(to bottom right, ${s.from}, ${s.to})` }}>
                    <div className={`${display} absolute inset-0 flex items-center justify-center text-6xl italic text-white/90`}>{s.initials}</div>
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-bold text-[#1b1c1a]">
                      <span className="material-symbols-outlined !text-[14px] text-[#725b38]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>{s.rating}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className={`${display} text-lg font-semibold text-[#1b1c1a]`}>{s.name}</h3>
                    <p className="mt-0.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[#725b38]">{s.role}</p>
                    <p className="mt-1 text-[13px] text-[#4d4540]">{s.sub}</p>
                    <a href="#chat-hint" className="mt-4 block w-full rounded-full border border-[#1b1c1a]/[0.1] py-2.5 text-center text-[13px] font-semibold text-[#1b1c1a] hover:border-[#1b1c1a] hover:bg-black hover:text-white">
                      Boek met {s.name.split(" ")[0]}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= LOCATIE ================= */}
        <section id="locatie" className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-12">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#725b38]">Willemsparkweg 84</p>
                <h2 className={`${display} mt-4 text-4xl font-semibold tracking-tight text-[#1b1c1a] sm:text-[2.75rem]`} style={{ textWrap: "balance" }}>Een Herenhuis voor de Zintuigen</h2>
                <p className="mt-5 text-[15px] leading-relaxed text-[#4d4540]">
                  Achter de negentiende-eeuwse gevel schuilt een atelier van hoge plafonds, daglicht
                  en stilte. Wij ontvingen dit herenhuis met respect voor zijn geschiedenis — en
                  herschiepen het tot een toevluchtsoord voor haar, huid en gemoed.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { icon: "directions_car", t: "Valet Parking", d: "Wij parkeren, u ontspant" },
                    { icon: "door_sliding", t: "Privé Suites", d: "Volledige rust en discretie" },
                    { icon: "schedule", t: "Ruime Openingstijden", d: "Zeven dagen per week bereikbaar" },
                    { icon: "local_florist", t: "Botanische Lounge", d: "Kruidenthee & stilte tussendoor" },
                  ].map((f) => (
                    <div key={f.t} className="rounded-2xl border border-[#1b1c1a]/[0.07] bg-white p-5">
                      <span className="material-symbols-outlined text-[#725b38]">{f.icon}</span>
                      <p className="mt-3 text-[13.5px] font-semibold text-[#1b1c1a]">{f.t}</p>
                      <p className="mt-1 text-[12.5px] text-[#4d4540]">{f.d}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-3xl bg-[#efeeea] p-7">
                  <div className="flex gap-0.5 text-[#725b38]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                  <p className={`${display} mt-3 text-lg italic leading-snug text-[#1b1c1a]`}>
                    „Ik kwam voor een balayage en verliet het pand als een ander mens — rustiger,
                    gezien, werkelijk verzorgd. Élixir Atelier begrijpt luxe als aandacht, niet als
                    opsmuk.”
                  </p>
                  <p className="mt-4 text-[13px] font-semibold text-[#4d4540]">— Emma V., klant sinds 2023</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="relative h-64 overflow-hidden rounded-3xl border border-[#1b1c1a]/[0.06] bg-[#efeeea] sm:h-80">
                  <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(0deg, rgba(114,91,56,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(114,91,56,.06) 1px, transparent 1px)", backgroundSize: "28px 28px" }}></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#4d4540]">
                    <span className="material-symbols-outlined !text-[34px] text-[#725b38]">location_on</span>
                    <p className="text-[13px] font-semibold text-[#1b1c1a]">Willemsparkweg 84, Amsterdam</p>
                    <p className="text-[12px] text-[#4d4540]">Interactieve kaart</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="group relative h-40 overflow-hidden rounded-3xl sm:h-48">
                    <div className="absolute inset-0 scale-105 bg-gradient-to-br from-[#efe6d4] to-[#c8a877] transition-transform duration-700 group-hover:scale-110"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/0"></div>
                    <p className={`${display} absolute bottom-3 left-4 text-[13px] italic text-white`}>Privé Salon</p>
                  </div>
                  <div className="group relative h-40 overflow-hidden rounded-3xl sm:h-48">
                    <div className="absolute inset-0 scale-105 bg-gradient-to-br from-[#4a3c2c] to-[#1b1c1a] transition-transform duration-700 group-hover:scale-110"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/0"></div>
                    <p className={`${display} absolute bottom-3 left-4 text-[13px] italic text-white`}>Aroma Apotheek</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= VIP MEMBERSHIP ================= */}
        <section className="relative overflow-hidden bg-black py-24 text-white">
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#C5A880] opacity-20 blur-[110px]"></div>
          <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-[#B6976F] opacity-20 blur-[130px]"></div>
          <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#e0c298]">Élixir Privé Membership</p>
                <h2 className={`${display} mt-4 text-4xl font-semibold tracking-tight sm:text-[2.75rem]`} style={{ textWrap: "balance" }}>Klaar voor uw transformatie?</h2>
                <p className="mt-4 max-w-[28rem] text-[15px] leading-relaxed text-white/70">
                  Word lid van Élixir Privé en ontvang toegang tot voorrechten die verder reiken dan
                  de stoel — of chat rechtsonder direct met onze AI-receptioniste voor een afspraak.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    { icon: "event_available", t: "Prioritaire Reservaties bij al onze stylisten" },
                    { icon: "redeem", t: "500 Welkomstpunten bij inschrijving" },
                    { icon: "celebration", t: "Champagne Welcome bij elk bezoek" },
                  ].map((b) => (
                    <li key={b.t} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#e0c298]">
                        <span className="material-symbols-outlined !text-[18px]">{b.icon}</span>
                      </span>
                      <span className="text-[14.5px] text-white/90">{b.t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-white/[0.06] p-8 ring-1 ring-white/10">
                <h3 className={`${display} text-xl font-semibold`}>Meld u vrijblijvend aan</h3>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/60">Naam</label>
                    <input type="text" placeholder="Uw volledige naam" className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[14.5px] text-white placeholder:text-white/40 outline-none focus:border-[#e0c298]" />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/60">E-mail of telefoonnummer</label>
                    <input type="text" placeholder="u@voorbeeld.nl" className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[14.5px] text-white placeholder:text-white/40 outline-none focus:border-[#e0c298]" />
                  </div>
                  <a href="#chat-hint" className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C5A880] to-[#B6976F] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(197,168,128,0.5)] transition-transform hover:scale-[1.02]">
                    Word Élixir Privé Lid
                    <span className="material-symbols-outlined !text-[18px]">north_east</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#1b1c1a]/[0.07] bg-[#f5f3ef]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <span className={`${display} text-2xl font-semibold text-[#1b1c1a]`}>Élixir Atelier</span>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#725b38]">Maison de Beauté</p>
              <p className="mt-4 max-w-[20rem] text-[13.5px] leading-relaxed text-[#4d4540]">
                Haute coiffure &amp; beauté, gewijd aan botanische zuiverheid en stille
                vakkundigheid.
              </p>
            </div>
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1b1c1a]">Vestigingen</h4>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[13.5px] font-semibold text-[#1b1c1a]">Amsterdam Oud-Zuid</p>
                  <p className="text-[13px] text-[#4d4540]">Willemsparkweg 84, 1071 HL</p>
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-[#1b1c1a]">Rotterdam Veerhaven</p>
                  <p className="text-[13px] text-[#4d4540]">Veerhaven 12, 3016 CK</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1b1c1a]">Openingstijden</h4>
              <div className="mt-4 rounded-2xl bg-[#efeeea] p-4">
                <div className="flex justify-between text-[12.5px] text-[#4d4540]"><span>Ma — Vr</span><span className="font-medium text-[#1b1c1a]">09:00 – 20:00</span></div>
                <div className="mt-1.5 flex justify-between text-[12.5px] text-[#4d4540]"><span>Zaterdag</span><span className="font-medium text-[#1b1c1a]">09:00 – 18:00</span></div>
                <div className="mt-1.5 flex justify-between text-[12.5px] text-[#4d4540]"><span>Zondag</span><span className="font-medium text-[#1b1c1a]">11:00 – 16:00</span></div>
              </div>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#1b1c1a]/[0.07] pt-8 sm:flex-row">
            <p className="text-[12.5px] text-[#4d4540]">© 2026 Élixir Atelier. Fictieve salon — onderdeel van de KapperAssistent-demo.</p>
          </div>
        </div>
      </footer>

      <ElixirChatWidget />
    </div>
  );
}
