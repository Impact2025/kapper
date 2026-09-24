"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/dal";
import { addIncidentUpdate, createIncident } from "@/lib/status/store";
import { COMPONENT_IDS, INCIDENT_STATUSES, SEVERITIES } from "@/lib/status/model";

const createSchema = z.object({
  title: z.string().trim().min(5).max(160),
  severity: z.enum(SEVERITIES),
  message: z.string().trim().min(5).max(2000),
  components: z.array(z.enum(COMPONENT_IDS)).min(1, "Kies minstens één onderdeel."),
});

const updateSchema = z.object({
  status: z.enum(INCIDENT_STATUSES),
  message: z.string().trim().min(3).max(2000),
});

function refresh() {
  revalidatePath("/status");
  revalidatePath("/admin/support/status");
}

export interface IncidentFormState {
  error?: string;
}

export async function createIncidentAction(_prev: IncidentFormState, formData: FormData): Promise<IncidentFormState> {
  const admin = await requireRole("admin");
  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    severity: formData.get("severity"),
    message: formData.get("message"),
    components: formData.getAll("components"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  await createIncident({ ...parsed.data, createdBy: admin.id });
  refresh();
  redirect("/admin/support/status");
}

export async function addUpdateAction(incidentId: string, formData: FormData): Promise<void> {
  await requireRole("admin");
  const parsed = updateSchema.safeParse({ status: formData.get("status"), message: formData.get("message") });
  if (!parsed.success) return;
  await addIncidentUpdate(incidentId, parsed.data.status, parsed.data.message);
  refresh();
}
