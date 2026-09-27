import { describe, it, expect } from "vitest";
import { groupPhotosByJob, type DossierPhoto } from "@/lib/jobs/photos";

const photo = (id: string, jobId: string, kind: string, at: string): DossierPhoto => ({
  id,
  blobUrl: `https://x/${id}.jpg`,
  kind,
  caption: null,
  createdAt: new Date(at),
  jobId,
  jobNumber: `K-${jobId}`,
  jobTitle: `Klus ${jobId}`,
  addressLine: null,
});

describe("groupPhotosByJob", () => {
  it("groups per klus, newest klus first", () => {
    const groups = groupPhotosByJob([
      photo("a", "1", "after", "2026-03-01T10:00:00Z"),
      photo("b", "2", "before", "2026-05-01T10:00:00Z"),
      photo("c", "1", "before", "2026-03-01T08:00:00Z"),
    ]);
    expect(groups.map((g) => g.jobId)).toEqual(["2", "1"]);
  });

  it("tells the story in order: voor, tijdens, na, probleem", () => {
    const [g] = groupPhotosByJob([
      photo("issue", "1", "issue", "2026-03-01T07:00:00Z"),
      photo("after", "1", "after", "2026-03-01T12:00:00Z"),
      photo("before", "1", "before", "2026-03-01T09:00:00Z"),
      photo("during", "1", "during", "2026-03-01T10:00:00Z"),
    ]);
    expect(g!.photos.map((p) => p.kind)).toEqual(["before", "during", "after", "issue"]);
  });

  it("flags a klus that has both voor and na", () => {
    const groups = groupPhotosByJob([
      photo("a", "1", "before", "2026-03-01T08:00:00Z"),
      photo("b", "1", "after", "2026-03-01T12:00:00Z"),
      photo("c", "2", "before", "2026-04-01T08:00:00Z"),
    ]);
    expect(groups.find((g) => g.jobId === "1")?.hasBeforeAfter).toBe(true);
    expect(groups.find((g) => g.jobId === "2")?.hasBeforeAfter).toBe(false);
  });

  it("returns nothing for no photos", () => {
    expect(groupPhotosByJob([])).toEqual([]);
  });
});
