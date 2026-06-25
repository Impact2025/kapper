export interface TimeSlot {
  date: string;        // ISO date "2026-06-26"
  time: string;        // "14:00"
  serviceType: string;
  durationMinutes: number;
  priceEuros: number;
}

export interface BookingInput {
  customerName: string;
  customerPhone: string;
  serviceType: string;
  date: string;        // ISO date "2026-06-26"
  time: string;        // "14:00"
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
