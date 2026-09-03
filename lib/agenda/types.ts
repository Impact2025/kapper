export interface TimeSlot {
  date: string;        // ISO date "2026-06-26"
  time: string;        // "14:00"
  serviceType: string;
  durationMinutes: number;
  priceEuros: number;
  /** First name of the staff member who'd perform this, when the provider exposes one. */
  staffName?: string;
  /**
   * Opaque provider-specific token identifying exactly this bookable slot
   * (which service, which staff member, which calendar). When the caller
   * supplies it back on `bookAppointment`, the adapter books precisely this
   * slot instead of re-guessing a service/staff match from a name — the
   * mechanism that used to let a mistyped service name silently double-book.
   */
  slotId: string;
}

export interface BookingInput {
  customerName: string;
  customerPhone: string;
  serviceType: string;
  date: string;        // ISO date "2026-06-26"
  time: string;        // "14:00"
  /** Preferred: the `TimeSlot.slotId` this booking was chosen from. */
  slotId?: string;
}

export interface BookingResult {
  ok: boolean;
  externalId?: string;
  error?: string;
}

export interface AgendaAdapter {
  /** Return available slots for the next `days` days. */
  getAvailableSlots(days?: number): Promise<TimeSlot[]>;
  /** Book an appointment. */
  bookAppointment(input: BookingInput): Promise<BookingResult>;
}
