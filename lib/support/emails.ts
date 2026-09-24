import { shell, button } from "@/lib/mail/templates";
import { publicEnv } from "@/lib/env";
import { formatTicketNumber } from "@/lib/support/ticket-model";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="font-size:15px;line-height:1.6;margin:0 0 14px;">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function ticketUrlForGuest(token: string): string {
  return `${publicEnv.NEXT_PUBLIC_SITE_URL}/support/${token}`;
}

export function ticketSubject(ticketNumber: number, subject: string): string {
  return `[${formatTicketNumber(ticketNumber)}] ${subject}`;
}

export function ticketConfirmationEmail(opts: {
  name: string;
  ticketNumber: number;
  subject: string;
  url: string;
  dueLabel: string;
}): string {
  return shell(
    `We hebben je vraag ontvangen`,
    `<p style="font-size:15px;line-height:1.6;margin:0 0 14px;">Hoi ${esc(opts.name)}, bedankt voor je bericht. Je ticketnummer is <strong>${formatTicketNumber(opts.ticketNumber)}</strong>.</p>
     <p style="font-size:15px;line-height:1.6;margin:0 0 14px;"><strong>Onderwerp:</strong> ${esc(opts.subject)}<br><strong>Streefreactietijd:</strong> ${esc(opts.dueLabel)}</p>
     <div style="margin:22px 0;">${button(opts.url, "Bekijk je ticket →")}</div>
     <p style="font-size:13px;color:#747871;">Via de link kun je de status volgen en reageren. Deel deze link met niemand anders.</p>`,
  );
}

export function ticketReplyEmail(opts: {
  name: string;
  ticketNumber: number;
  subject: string;
  agentName: string;
  body: string;
  url: string;
}): string {
  return shell(
    `Nieuw antwoord op ${formatTicketNumber(opts.ticketNumber)}`,
    `<p style="font-size:15px;line-height:1.6;margin:0 0 14px;">Hoi ${esc(opts.name)}, ${esc(opts.agentName)} heeft gereageerd op “${esc(opts.subject)}”:</p>
     <div style="border-left:3px solid #526350;padding:4px 0 4px 14px;margin:0 0 18px;">${paragraphs(opts.body)}</div>
     <div style="margin:22px 0;">${button(opts.url, "Reageer in je ticket →")}</div>`,
  );
}

export function ticketStatusEmail(opts: {
  name: string;
  ticketNumber: number;
  subject: string;
  headline: string;
  message: string;
  url: string;
}): string {
  return shell(
    opts.headline,
    `<p style="font-size:15px;line-height:1.6;margin:0 0 14px;">Hoi ${esc(opts.name)},</p>
     ${paragraphs(opts.message)}
     <p style="font-size:14px;color:#747871;margin:0 0 14px;">${formatTicketNumber(opts.ticketNumber)} — ${esc(opts.subject)}</p>
     <div style="margin:22px 0;">${button(opts.url, "Bekijk je ticket →")}</div>`,
  );
}

export function ticketNotifyStaffEmail(opts: {
  ticketNumber: number;
  subject: string;
  requester: string;
  category: string;
  priority: string;
  body: string;
  adminUrl: string;
  kind: "nieuw" | "reactie";
}): string {
  return shell(
    opts.kind === "nieuw" ? `Nieuw ticket ${formatTicketNumber(opts.ticketNumber)}` : `Klantreactie op ${formatTicketNumber(opts.ticketNumber)}`,
    `<p style="font-size:14px;line-height:1.6;margin:0 0 10px;"><strong>${esc(opts.subject)}</strong><br>Van: ${esc(opts.requester)} · ${esc(opts.category)} · prioriteit ${esc(opts.priority)}</p>
     <div style="border-left:3px solid #526350;padding:4px 0 4px 14px;margin:0 0 18px;">${paragraphs(opts.body.slice(0, 1500))}</div>
     <div style="margin:22px 0;">${button(opts.adminUrl, "Open in helpdesk →")}</div>`,
  );
}
