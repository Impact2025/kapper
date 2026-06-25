import type { ScanResult } from "@/lib/scan/run-scan";
import { publicEnv } from "@/lib/env";

const BRAND = "#526350";
const CREAM = "#fbf9f8";
const INK = "#1b1c1c";

function shell(title: string, inner: string): string {
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:${CREAM};font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="font-size:22px;font-weight:700;color:${BRAND};margin-bottom:24px;">KapperAssistent.nl</div>
    <div style="background:#ffffff;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(143,161,139,0.12);">
      <h1 style="font-family:Georgia,'EB Garamond',serif;font-size:24px;line-height:1.3;margin:0 0 16px;color:${INK};">${title}</h1>
      ${inner}
    </div>
    <p style="font-size:12px;color:#747871;text-align:center;margin-top:24px;">
      © ${new Date().getFullYear()} KapperAssistent.nl · <a href="${publicEnv.NEXT_PUBLIC_SITE_URL}" style="color:${BRAND};">kappersassistent.nl</a>
    </p>
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px;">${label}</a>`;
}

function eur(n: number): string {
  return "€" + n.toLocaleString("nl-NL");
}

export function welcomeEmail({
  salonName,
  setPasswordUrl,
}: {
  salonName: string;
  setPasswordUrl: string;
}): string {
  const inner = `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Welkom bij KapperAssistent! Je account voor <strong>${salonName}</strong> is aangemaakt.</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Klik op de knop hieronder om je wachtwoord in te stellen en direct in te loggen. De link is 24 uur geldig.</p>
    <div style="margin-bottom:24px;">${button(setPasswordUrl, "Wachtwoord instellen en inloggen →")}</div>
    <p style="font-size:13px;color:#747871;">Heb je dit account niet aangemaakt? Neem dan contact met ons op via <a href="mailto:support@kappersassistent.nl" style="color:${BRAND};">support@kappersassistent.nl</a>.</p>
  `;
  return shell(`Welkom bij KapperAssistent, ${salonName}!`, inner);
}

/** Generic email: a title + free-text body (newlines become paragraphs). */
export function simpleEmail({ title, body }: { title: string; body: string }): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${p
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  return shell(title, paragraphs);
}

export function aiLiveEmail({ salonName, dashboardUrl }: { salonName: string; dashboardUrl: string }): string {
  const inner = `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Goed nieuws! De AI-assistent van <strong>${salonName}</strong> heeft zojuist zijn eerste gesprek afgehandeld. Je AI-receptionist staat live. 🎉</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Klanten kunnen je nu bereiken via WhatsApp en/of telefoon. De AI plant afspraken in, beantwoordt vragen en stuurt herinneringen — terwijl jij gewoon aan het werk bent.</p>
    <div style="margin-bottom:24px;">${button(dashboardUrl, "Bekijk je eerste gesprekken →")}</div>
    <p style="font-size:13px;color:#747871;">Je KPI's worden bijgewerkt zodra er meer data binnenkomt.</p>
  `;
  return shell(`Je AI-assistent staat live, ${salonName}!`, inner);
}

export function weeklyDigestEmail({
  salonName,
  period,
  callsHandled,
  bookingsMade,
  noShowsPrevented,
  protectedRevenueEur,
  dashboardUrl,
}: {
  salonName: string;
  period: string;
  callsHandled: number;
  bookingsMade: number;
  noShowsPrevented: number;
  protectedRevenueEur: number;
  dashboardUrl: string;
}): string {
  const inner = `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hier is je weekoverzicht voor <strong>${salonName}</strong> (${period}).</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <tr style="background:#f5f3f0;">
        <td style="padding:10px 12px;color:#444842;font-weight:600;">Gesprekken afgehandeld</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:18px;">${callsHandled}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#444842;">Boekingen via AI</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:18px;">${bookingsMade}</td>
      </tr>
      <tr style="background:#f5f3f0;">
        <td style="padding:10px 12px;color:#444842;">No-shows voorkomen</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:18px;">${noShowsPrevented}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#444842;font-weight:600;">Beschermde omzet</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:18px;color:#526350;">€${protectedRevenueEur}</td>
      </tr>
    </table>
    <div style="margin-bottom:16px;">${button(dashboardUrl, "Open dashboard →")}</div>
  `;
  return shell(`Weekoverzicht ${salonName}`, inner);
}

export function adminReportEmail({
  period,
  periodKey,
  summary,
  rows,
}: {
  period: string;
  periodKey: string;
  summary: string;
  rows: { label: string; value: string }[];
}): string {
  const table = rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 0;color:#444842;">${r.label}</td><td style="text-align:right;font-weight:600;">${r.value}</td></tr>`,
    )
    .join("");
  const inner = `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${summary}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${table}</table>
    <div style="margin-top:24px;">${button(`${publicEnv.NEXT_PUBLIC_SITE_URL}/admin/reports`, "Open dashboard")}</div>
  `;
  const title = `${period === "monthly" ? "Maandrapport" : "Dagrapport"} — ${periodKey}`;
  return shell(title, inner);
}

export function scanReportEmail({
  salonName,
  result,
}: {
  salonName: string;
  result: ScanResult;
}): string {
  const r = result.revenue;
  const inner = `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${result.summary}</p>
    <div style="background:${CREAM};border-radius:12px;padding:20px;margin:16px 0;">
      <div style="font-size:13px;color:#747871;text-transform:uppercase;letter-spacing:.5px;">Geschat gemist maandinkomen</div>
      <div style="font-family:Georgia,serif;font-size:40px;color:${BRAND};font-weight:600;">${eur(r.totalMonthly)}</div>
      <div style="font-size:13px;color:#444842;">≈ ${eur(r.totalYearly)} per jaar</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#444842;">Gemiste oproepen / maand</td><td style="text-align:right;font-weight:600;">${r.missedCallsPerMonth}</td></tr>
      <tr><td style="padding:6px 0;color:#444842;">Herwonnen leads (60%)</td><td style="text-align:right;font-weight:600;">${r.recoveredLeads}</td></tr>
      <tr><td style="padding:6px 0;color:#444842;">Extra boekingen (30%)</td><td style="text-align:right;font-weight:600;">${r.extraBookings}</td></tr>
      <tr><td style="padding:6px 0;color:#444842;">No-show besparing</td><td style="text-align:right;font-weight:600;">${eur(r.noShowSavings)}</td></tr>
    </table>
    ${result.performanceScore != null ? `<p style="font-size:13px;color:#747871;margin-top:16px;">Website-prestatie: ${result.performanceScore}/100 · SEO: ${result.seoScore ?? "—"}/100</p>` : ""}
    <div style="margin-top:24px;">${button(`${publicEnv.NEXT_PUBLIC_SITE_URL}/scan`, "Start je 14-daagse pilot")}</div>
  `;
  return shell(`Je AI & SEO-scan voor ${salonName}`, inner);
}

export function scanLeadNotifyEmail({
  input,
  result,
}: {
  input: { salonName: string; url: string; email: string; phone?: string; city?: string };
  result: ScanResult;
}): string {
  const inner = `
    <p style="font-size:15px;line-height:1.6;">Er is een nieuwe scan-lead binnengekomen.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#444842;">Salon</td><td style="text-align:right;font-weight:600;">${input.salonName}</td></tr>
      <tr><td style="padding:6px 0;color:#444842;">Website</td><td style="text-align:right;">${result.normalizedUrl}</td></tr>
      <tr><td style="padding:6px 0;color:#444842;">E-mail</td><td style="text-align:right;">${input.email}</td></tr>
      <tr><td style="padding:6px 0;color:#444842;">Telefoon</td><td style="text-align:right;">${input.phone || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#444842;">Plaats</td><td style="text-align:right;">${input.city || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#444842;">Gemist/maand</td><td style="text-align:right;font-weight:600;">${eur(result.revenue.totalMonthly)}</td></tr>
    </table>
    <div style="margin-top:20px;">${button(`${publicEnv.NEXT_PUBLIC_SITE_URL}/admin/crm`, "Open in CRM")}</div>
  `;
  return shell("Nieuwe scan-lead", inner);
}
