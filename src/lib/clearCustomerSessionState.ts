import type { QueryClient } from '@tanstack/react-query';

import { customerQueryKeyRoot } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';

/**
 * Rimuove dati cliente da cache e store locali (privacy cross-account).
 *
 * Query eliminate (prefisso `customer`):
 * - profile-link, profile-name
 * - bookings
 * - salons, services (per salone)
 * - staff, availability (per salone/servizi/data)
 */
export function clearCustomerSessionState(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: customerQueryKeyRoot });
  useBookingStore.getState().resetBooking();
  useAuthStore.getState().clearSession();
}

/** Logout Supabase + pulizia cache/store cliente. */
export async function logoutCustomer(queryClient: QueryClient): Promise<void> {
  await supabase.auth.signOut();
  clearCustomerSessionState(queryClient);
}
