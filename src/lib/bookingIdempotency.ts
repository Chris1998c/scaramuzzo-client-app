/** Fingerprint stabile del payload booking per rigenerare Idempotency-Key solo al cambio dati. */
export function buildBookingPayloadFingerprint(params: {
  salonId: string | number | null;
  serviceIds: (string | number)[];
  staffId: string | number | null;
  startTime: string | undefined;
  notes: string;
}): string {
  // Ordine service_ids allineato al Manager (hash server order-sensitive).
  const serviceIds = [...params.serviceIds].map((id) => String(id));

  return JSON.stringify({
    salon_id: String(params.salonId ?? ''),
    service_ids: serviceIds,
    staff_id: String(params.staffId ?? ''),
    start_time: params.startTime ?? '',
    notes: params.notes.trim(),
  });
}
