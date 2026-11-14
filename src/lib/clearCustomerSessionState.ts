import type { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { customerQueryKeyRoot } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { customerFetch } from '@/services/customerApi';
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
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistration('/app-clienti/')
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => subscription?.unsubscribe())
      .catch(() => { /* uscita non deve essere bloccata dal browser */ });
  }
}

/** Logout Supabase + pulizia cache/store cliente. */
export async function logoutCustomer(queryClient: QueryClient): Promise<void> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/app-clienti/');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await customerFetch('/api/customer/v1/push-subscription', {
          method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
    } catch { /* il logout resta possibile anche senza rete */ }
  }
  await supabase.auth.signOut();
  clearCustomerSessionState(queryClient);
}
