"use client";

import { useState } from "react";

const TREATMENTS = [
  "Bespoke Balayage & Toning",
  "Signature Haircut & Sculpting",
  "Botanical Glossing & Repair Ritual",
  "Couture Updo & Event Styling",
];

const STYLISTS = ["Geen voorkeur", "Elena Vance", "Julian de Vries", "Chloé Laurent", "Lucas Moreau"];

export function ElixirBookingBar() {
  const [treatment, setTreatment] = useState(TREATMENTS[0]);
  const [stylist, setStylist] = useState(STYLISTS[0]);
  const [date, setDate] = useState("");

  function handleSearch() {
    const dateText = date
      ? new Date(date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
      : "de eerstvolgende mogelijkheid";
    const stylistText = stylist === "Geen voorkeur" ? "" : ` bij ${stylist}`;
    const message = `Ik wil graag een ${treatment} boeken${stylistText} op ${dateText}. Wat is de beschikbaarheid?`;
    window.dispatchEvent(new CustomEvent("elixir:book-request", { detail: { message } }));
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-2 sm:divide-x sm:divide-[#1b1c1a]/[0.07]">
      <label className="flex flex-col gap-1 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4d4540]">Behandeling</span>
        <select
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          className="w-full appearance-none bg-transparent text-[14.5px] font-medium text-[#1b1c1a] outline-none"
        >
          {TREATMENTS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4d4540]">Stylist</span>
        <select
          value={stylist}
          onChange={(e) => setStylist(e.target.value)}
          className="w-full appearance-none bg-transparent text-[14.5px] font-medium text-[#1b1c1a] outline-none"
        >
          {STYLISTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4d4540]">Datum</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-transparent text-[14.5px] font-medium text-[#1b1c1a] outline-none"
        />
      </label>
      <div className="flex items-end px-1.5 py-1.5">
        <button
          type="button"
          onClick={handleSearch}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C5A880] to-[#B6976F] px-4 py-3.5 text-[13.5px] font-semibold text-white shadow-[0_10px_20px_-8px_rgba(114,91,56,0.55)] transition-transform hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined !text-[18px]">search</span>
          Zoek Beschikbaarheid
        </button>
      </div>
    </div>
  );
}
