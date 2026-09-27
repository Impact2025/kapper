import "server-only";
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterCampaigns, newsletterSends, newsletterSubscribers } from "@/lib/db/schema";
import { env, publicEnv } from "@/lib/env";
import { getResend } from "@/lib/mail/resend";
import { brandFor } from "@/lib/mail/templates";
import { captureError } from "@/lib/observability";
import { parseBlocks, type NewsletterBlock } from "@/lib/newsletter/blocks";
import { renderNewsletterHtml, renderNewsletterText, type RenderRecipient } from "@/lib/newsletter/render";
import { abVariant, parseSegment } from "@/lib/newsletter/segment";
import { clickUrl, openPixelUrl } from "@/lib/newsletter/tracking";
import { audienceFor, oneClickUnsubscribeUrl, unsubscribeUrl } from "@/lib/newsletter/subscribers";

export type CampaignRow = typeof newsletterCampaigns.$inferSelect;

/** Resend's batch endpoint takes at most 100 messages per call. */
const BATCH_SIZE = 100;

export async function listCampaigns(): Promise<(CampaignRow & { recipients: number; opened: number; clicked: number })[]> {
  if (!env.DATABASE_URL) return [];
  const rows = await db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.createdAt)).limit(100);
  if (!rows.length) return [];
  const stats = await db
    .select({
      campaignId: newsletterSends.campaignId,
      recipients: sql<number>`count(*)`,
      opened: sql<number>`count(${newsletterSends.openedAt})`,
      clicked: sql<number>`count(${newsletterSends.clickedAt})`,
    })
    .from(newsletterSends)
    .where(inArray(newsletterSends.campaignId, rows.map((r) => r.id)))
    .groupBy(newsletterSends.campaignId);
  const byId = new Map(stats.map((s) => [s.campaignId, s]));
  return rows.map((r) => ({
    ...r,
    recipients: Number(byId.get(r.id)?.recipients ?? 0),
    opened: Number(byId.get(r.id)?.opened ?? 0),
    clicked: Number(byId.get(r.id)?.clicked ?? 0),
  }));
}

export async function getCampaign(id: string): Promise<CampaignRow | null> {
  if (!env.DATABASE_URL) return null;
  const [row] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id)).limit(1);
  return row ?? null;
}

interface RenderInput {
  campaign: Pick<CampaignRow, "subject" | "subjectB" | "previewText" | "vertical">;
  blocks: NewsletterBlock[];
  recipient: RenderRecipient;
  token: string;
  sendId?: string | null;
  variant?: "A" | "B";
}

/** Render one personalised copy. Tracking only when there's a send row and a signing secret. */
export function renderForRecipient({ campaign, blocks, recipient, token, sendId, variant = "A" }: RenderInput) {
  const brand = brandFor(campaign.vertical);
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const secret = env.AUTH_SECRET;
  const track = sendId && secret;
  const subject = (variant === "B" && campaign.subjectB) || campaign.subject;
  const unsub = unsubscribeUrl(token) + (sendId ? `?s=${sendId}` : "");
  const html = renderNewsletterHtml(blocks, {
    brand,
    subject,
    previewText: campaign.previewText,
    recipient,
    unsubscribeUrl: unsub,
    trackUrl: track ? (u) => clickUrl(base, secret, sendId, u) : undefined,
    openPixelUrl: track ? openPixelUrl(base, secret, sendId) : null,
  });
  const text = renderNewsletterText(blocks, { brand, recipient, unsubscribeUrl: unsub });
  return { subject, html, text, from: `${brand.name} <${fromAddress()}>` };
}

function fromAddress(): string {
  // MAIL_FROM is "Name <addr>" — reuse its address with the campaign's brand name.
  const m = /<([^>]+)>/.exec(env.MAIL_FROM);
  return m?.[1] ?? env.MAIL_FROM;
}

export async function sendTestEmail(campaign: CampaignRow, to: { email: string; name: string | null }): Promise<string | null> {
  const resend = getResend();
  if (!resend) return null;
  const { subject, html, text, from } = renderForRecipient({
    campaign,
    blocks: parseBlocks(campaign.blocks),
    recipient: to,
    token: "test",
  });
  const { data, error } = await resend.emails.send({ from, to: to.email, subject: `[TEST] ${subject}`, html, text });
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

/**
 * Freeze the audience into send rows and mark the campaign sending (or
 * scheduled). Idempotent per subscriber thanks to the (campaign, subscriber)
 * unique index — re-queueing never mails anyone twice.
 */
export async function queueCampaign(id: string, scheduledAt: Date | null): Promise<{ queued: number }> {
  const campaign = await getCampaign(id);
  if (!campaign || campaign.status === "sent" || campaign.status === "sending") return { queued: 0 };
  const audience = await audienceFor(parseSegment(campaign.segment));
  if (audience.length) {
    for (let i = 0; i < audience.length; i += 1000) {
      await db
        .insert(newsletterSends)
        .values(
          audience.slice(i, i + 1000).map((m) => ({
            campaignId: id,
            subscriberId: m.id,
            variant: abVariant(m.id, !!campaign.subjectB),
          })),
        )
        .onConflictDoNothing();
    }
  }
  const future = scheduledAt && scheduledAt.getTime() > Date.now();
  await db
    .update(newsletterCampaigns)
    .set({ status: future ? "scheduled" : "sending", scheduledAt: future ? scheduledAt : null })
    .where(eq(newsletterCampaigns.id, id));
  return { queued: audience.length };
}

/**
 * Deliver queued sends. Called by the cron and right after "Verzenden".
 * Claims rows atomically (FOR UPDATE SKIP LOCKED) so concurrent runs can't
 * double-send; recipients who unsubscribed after queueing are skipped.
 */
export async function processNewsletterQueue(maxBatches = 5): Promise<{ sent: number; failed: number }> {
  if (!env.DATABASE_URL) return { sent: 0, failed: 0 };
  // Scheduled campaigns whose time has come start sending.
  await db
    .update(newsletterCampaigns)
    .set({ status: "sending" })
    .where(and(eq(newsletterCampaigns.status, "scheduled"), lte(newsletterCampaigns.scheduledAt, new Date())));

  const resend = getResend();
  let sent = 0;
  let failed = 0;
  const campaignCache = new Map<string, { campaign: CampaignRow; blocks: NewsletterBlock[] }>();

  for (let batch = 0; batch < maxBatches; batch++) {
    const claimed = await db.execute<{ id: string; campaign_id: string; subscriber_id: string; variant: string }>(sql`
      update ${newsletterSends} set status = 'claimed'
      where id in (
        select s.id from ${newsletterSends} s
        join ${newsletterCampaigns} c on c.id = s.campaign_id
        where s.status = 'queued' and c.status = 'sending'
        order by s.created_at
        limit ${BATCH_SIZE}
        for update of s skip locked
      )
      returning id, campaign_id, subscriber_id, variant`);
    const rows = claimed.rows;
    if (!rows.length) break;

    const subs = await db
      .select()
      .from(newsletterSubscribers)
      .where(inArray(newsletterSubscribers.id, rows.map((r) => r.subscriber_id)));
    const subById = new Map(subs.map((s) => [s.id, s]));

    const messages: { sendId: string; payload: Parameters<NonNullable<ReturnType<typeof getResend>>["emails"]["send"]>[0] }[] = [];
    const skipped: string[] = [];
    for (const r of rows) {
      const sub = subById.get(r.subscriber_id);
      if (!sub || sub.status !== "subscribed") {
        skipped.push(r.id);
        continue;
      }
      let c = campaignCache.get(r.campaign_id);
      if (!c) {
        const campaign = (await getCampaign(r.campaign_id))!;
        c = { campaign, blocks: parseBlocks(campaign.blocks) };
        campaignCache.set(r.campaign_id, c);
      }
      const { subject, html, text, from } = renderForRecipient({
        campaign: c.campaign,
        blocks: c.blocks,
        recipient: { email: sub.email, name: sub.name },
        token: sub.token,
        sendId: r.id,
        variant: r.variant === "B" ? "B" : "A",
      });
      messages.push({
        sendId: r.id,
        payload: {
          from,
          to: sub.email,
          subject,
          html,
          text,
          headers: {
            // RFC 8058 one-click unsubscribe — required by Gmail/Yahoo for bulk senders.
            "List-Unsubscribe": `<${oneClickUnsubscribeUrl(sub.token)}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
          tags: [{ name: "campaign", value: r.campaign_id }],
        },
      });
    }

    if (skipped.length) {
      await db.update(newsletterSends).set({ status: "failed", error: "afgemeld vóór verzending" }).where(inArray(newsletterSends.id, skipped));
    }
    if (!messages.length) continue;

    if (!resend) {
      await db.update(newsletterSends).set({ status: "failed", error: "RESEND_API_KEY ontbreekt" }).where(inArray(newsletterSends.id, messages.map((m) => m.sendId)));
      failed += messages.length;
      continue;
    }

    try {
      const { data, error } = await resend.batch.send(messages.map((m) => m.payload));
      if (error) throw new Error(error.message);
      const ids = data?.data ?? [];
      const now = new Date();
      await Promise.all(
        messages.map((m, i) =>
          db.update(newsletterSends).set({ status: "sent", resendId: ids[i]?.id ?? null, sentAt: now }).where(eq(newsletterSends.id, m.sendId)),
        ),
      );
      sent += messages.length;
    } catch (err) {
      captureError("newsletter/batch", err);
      const message = err instanceof Error ? err.message.slice(0, 500) : "onbekende fout";
      await db.update(newsletterSends).set({ status: "failed", error: message }).where(inArray(newsletterSends.id, messages.map((m) => m.sendId)));
      failed += messages.length;
    }
  }

  // Campaigns with nothing left in the queue are done.
  await db.execute(sql`
    update ${newsletterCampaigns} c set status = 'sent', sent_at = now()
    where c.status = 'sending'
      and not exists (select 1 from ${newsletterSends} s where s.campaign_id = c.id and s.status in ('queued', 'claimed'))`);

  return { sent, failed };
}

export interface CampaignStats {
  recipients: number;
  sent: number;
  failed: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  byVariant: { variant: string; sent: number; opened: number; clicked: number }[];
  topLinks: { url: string; clicks: number }[];
}

export async function campaignStats(id: string): Promise<CampaignStats> {
  const empty: CampaignStats = { recipients: 0, sent: 0, failed: 0, bounced: 0, opened: 0, clicked: 0, unsubscribed: 0, byVariant: [], topLinks: [] };
  if (!env.DATABASE_URL) return empty;
  const [totals, variants, links] = await Promise.all([
    db
      .select({
        recipients: sql<number>`count(*)`,
        sent: sql<number>`count(*) filter (where ${newsletterSends.status} in ('sent', 'bounced', 'complained'))`,
        failed: sql<number>`count(*) filter (where ${newsletterSends.status} = 'failed')`,
        bounced: sql<number>`count(*) filter (where ${newsletterSends.status} in ('bounced', 'complained'))`,
        opened: sql<number>`count(${newsletterSends.openedAt})`,
        clicked: sql<number>`count(${newsletterSends.clickedAt})`,
        unsubscribed: sql<number>`count(${newsletterSends.unsubscribedAt})`,
      })
      .from(newsletterSends)
      .where(eq(newsletterSends.campaignId, id)),
    db
      .select({
        variant: newsletterSends.variant,
        sent: sql<number>`count(*) filter (where ${newsletterSends.status} in ('sent', 'bounced', 'complained'))`,
        opened: sql<number>`count(${newsletterSends.openedAt})`,
        clicked: sql<number>`count(${newsletterSends.clickedAt})`,
      })
      .from(newsletterSends)
      .where(eq(newsletterSends.campaignId, id))
      .groupBy(newsletterSends.variant),
    db.execute<{ url: string; clicks: number }>(sql`
      select key as url, sum(value::int) as clicks
      from ${newsletterSends}, jsonb_each_text(${newsletterSends.clicks})
      where ${newsletterSends.campaignId} = ${id}
      group by key order by clicks desc limit 10`),
  ]);
  const t = totals[0];
  const n = (v: unknown) => Number(v ?? 0);
  return {
    recipients: n(t?.recipients),
    sent: n(t?.sent),
    failed: n(t?.failed),
    bounced: n(t?.bounced),
    opened: n(t?.opened),
    clicked: n(t?.clicked),
    unsubscribed: n(t?.unsubscribed),
    byVariant: variants.map((v) => ({ variant: v.variant, sent: n(v.sent), opened: n(v.opened), clicked: n(v.clicked) })).sort((a, b) => a.variant.localeCompare(b.variant)),
    topLinks: links.rows.map((l) => ({ url: l.url, clicks: n(l.clicks) })),
  };
}

/** Record an open (first one wins) — from the tracking pixel. */
export async function recordOpen(sendId: string): Promise<void> {
  if (!env.DATABASE_URL) return;
  await db
    .update(newsletterSends)
    .set({ openedAt: sql`coalesce(${newsletterSends.openedAt}, now())` })
    .where(eq(newsletterSends.id, sendId));
}

/** Record a click; a click also implies an open (images are often blocked). */
export async function recordClick(sendId: string, url: string): Promise<void> {
  if (!env.DATABASE_URL) return;
  await db
    .update(newsletterSends)
    .set({
      clickedAt: sql`coalesce(${newsletterSends.clickedAt}, now())`,
      openedAt: sql`coalesce(${newsletterSends.openedAt}, now())`,
      clicks: sql`jsonb_set(${newsletterSends.clicks}, ARRAY[${url}]::text[], to_jsonb(coalesce((${newsletterSends.clicks} ->> ${url})::int, 0) + 1))`,
    })
    .where(eq(newsletterSends.id, sendId));
}
