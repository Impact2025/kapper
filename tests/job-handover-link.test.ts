import { describe, it, expect } from "vitest";
import { handoverPath, handoverSignature, verifyHandoverSignature } from "@/lib/jobs/handover-link";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("handover link", () => {
  it("is deterministic per klus and verifies", () => {
    expect(handoverSignature(A)).toBe(handoverSignature(A));
    expect(verifyHandoverSignature(A, handoverSignature(A))).toBe(true);
  });

  it("does not verify for another klus, a tampered or a wrong-length signature", () => {
    expect(verifyHandoverSignature(B, handoverSignature(A))).toBe(false);
    expect(verifyHandoverSignature(A, handoverSignature(A).replace(/.$/, "x"))).toBe(false);
    expect(verifyHandoverSignature(A, "kort")).toBe(false);
    expect(verifyHandoverSignature(A, "")).toBe(false);
  });

  it("builds the public path from id and signature", () => {
    expect(handoverPath(A)).toBe(`/oplevering/${A}/${handoverSignature(A)}`);
  });
});
