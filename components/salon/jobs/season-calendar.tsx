import { MONTH_NAMES_SHORT, formatMoney, inSeason, type ContractCadence } from "@/lib/jobs/model";
import { seasonTotals, type SeasonContract } from "@/lib/jobs/season";
import { customerDisplayName } from "@/lib/jobs/model";

type Row = ContractCadence & SeasonContract & { id: string; name: string; customerName: string; customerCompany: string | null };

/**
 * Seizoenskalender: welke contracten in welke maanden beurten opleveren en wat
 * dat per maand aan omzet betekent. Server component — pure weergave van
 * lib/jobs/season.ts.
 */
export function SeasonCalendar({ contracts, currentMonth }: { contracts: Row[]; currentMonth: number }) {
  const totals = seasonTotals(contracts);
  const max = Math.max(1, ...totals.map((t) => t.revenueCents));

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-y-1 text-label-sm">
        <thead>
          <tr>
            <th className="w-24 text-left font-normal text-on-surface-variant sm:w-48">Contract</th>
            {MONTH_NAMES_SHORT.map((m, i) => (
              <th key={m} className={`text-center font-normal ${i + 1 === currentMonth ? "text-primary" : "text-on-surface-variant"}`}>
                <span className="sm:hidden">{m[0]}</span>
                <span className="hidden sm:inline">{m}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => (
            <tr key={c.id}>
              <td className="truncate pr-xs text-label-md text-on-surface sm:pr-sm sm:text-body-md">
                {customerDisplayName({ name: c.customerName, companyName: c.customerCompany })}
                <span className="block truncate text-label-sm text-on-surface-variant">{c.name}</span>
              </td>
              {MONTH_NAMES_SHORT.map((m, i) => (
                <td key={m} className="px-[1px] sm:px-[2px]">
                  <div
                    className={`h-6 rounded ${inSeason(c, i + 1) ? "bg-primary/70" : "bg-surface-container"} ${i + 1 === currentMonth ? "ring-2 ring-primary" : ""}`}
                    title={inSeason(c, i + 1) ? "Beurten in deze maand" : "Buiten het seizoen"}
                  />
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="pr-sm pt-sm text-label-md text-on-surface-variant">Verwachte omzet</td>
            {totals.map((t) => (
              <td key={t.label} className="px-[1px] pt-sm align-bottom sm:px-[2px]">
                <div className="flex h-16 flex-col justify-end">
                  <div className="rounded-t bg-secondary/70" style={{ height: `${Math.round((t.revenueCents / max) * 100)}%` }} title={`${t.visits} beurten`} />
                </div>
                <div className="mt-[2px] hidden text-center text-[10px] text-on-surface-variant sm:block">{t.revenueCents ? formatMoney(t.revenueCents).replace(",00", "") : "—"}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
