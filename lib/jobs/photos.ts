/**
 * Fotodossier per klant — pure grouping so it is unit tested. Photos come out
 * of the DB flat; the dashboard shows them per klus, newest klus first, with
 * the story of the work in order: voor → tijdens → na (problemen last).
 */
export interface DossierPhoto {
  id: string;
  blobUrl: string;
  kind: string;
  caption: string | null;
  createdAt: Date;
  jobId: string;
  jobNumber: string;
  jobTitle: string;
  addressLine: string | null;
}

export interface PhotoGroup {
  jobId: string;
  jobNumber: string;
  jobTitle: string;
  addressLine: string | null;
  /** Newest photo of the klus — the sort key for the groups. */
  latestAt: Date;
  photos: DossierPhoto[];
  /** True when the klus has both a "voor" and a "na" foto. */
  hasBeforeAfter: boolean;
}

const KIND_ORDER: Record<string, number> = { before: 0, during: 1, after: 2, issue: 3 };

export function groupPhotosByJob(photos: DossierPhoto[]): PhotoGroup[] {
  const byJob = new Map<string, DossierPhoto[]>();
  for (const p of photos) byJob.set(p.jobId, [...(byJob.get(p.jobId) ?? []), p]);

  const groups: PhotoGroup[] = [];
  for (const list of byJob.values()) {
    const sorted = [...list].sort(
      (a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9) || a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const first = sorted[0]!;
    groups.push({
      jobId: first.jobId,
      jobNumber: first.jobNumber,
      jobTitle: first.jobTitle,
      addressLine: first.addressLine,
      latestAt: new Date(Math.max(...list.map((p) => p.createdAt.getTime()))),
      photos: sorted,
      hasBeforeAfter: list.some((p) => p.kind === "before") && list.some((p) => p.kind === "after"),
    });
  }
  return groups.sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
}
