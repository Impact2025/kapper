"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { assignTicket, setTicketPriority, setTicketStatus } from "@/lib/support/tickets";
import { TICKET_PRIORITIES, TICKET_STATUSES, type TicketPriority, type TicketStatus } from "@/lib/support/ticket-model";

function refresh(ticketId: string) {
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath(`/dashboard/support/${ticketId}`);
}

export async function setStatusAction(ticketId: string, formData: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const status = String(formData.get("status") ?? "");
  if (!(TICKET_STATUSES as readonly string[]).includes(status)) return;
  await setTicketStatus(ticketId, status as TicketStatus, admin.name ?? "Support");
  refresh(ticketId);
}

export async function assignAction(ticketId: string, formData: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const to = String(formData.get("to") ?? "");
  await assignTicket(ticketId, to === "me" ? admin.id : null);
  refresh(ticketId);
}

export async function setPriorityAction(ticketId: string, formData: FormData): Promise<void> {
  await requireRole("admin");
  const priority = String(formData.get("priority") ?? "");
  if (!(TICKET_PRIORITIES as readonly string[]).includes(priority)) return;
  await setTicketPriority(ticketId, priority as TicketPriority);
  refresh(ticketId);
}
