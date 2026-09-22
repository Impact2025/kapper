import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendBookingFallbackSms } from "@/lib/sms/twilio";

describe("sendBookingFallbackSms", () => {
  it("no-ops silently when Twilio isn't configured (no env vars set)", async () => {
    await expect(
      sendBookingFallbackSms({ toPhone: "+31611112222", salonName: "Kapsalon Anna", salonPhone: "020-1234567" }),
    ).resolves.toBeUndefined();
  });
});
