import { useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { isInvalidAuthSessionError, supabase } from '@/lib/supabase';

let foregroundRefreshInFlight: Promise<void> | null = null;

async function refreshSessionOnForeground(): Promise<void> {
  if (foregroundRefreshInFlight) {
    return foregroundRefreshInFlight;
  }

  foregroundRefreshInFlight = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      const { error } = await supabase.auth.refreshSession();

      if (error && isInvalidAuthSessionError(error)) {
        await supabase.auth.signOut();
      }
    } catch {
      // customerFetch gestisce 401; nessun crash in foreground
    } finally {
      foregroundRefreshInFlight = null;
    }
  })();

  return foregroundRefreshInFlight;
}

function handleNativeAppStateChange(nextState: AppStateStatus): void {
  if (nextState === 'active') {
    supabase.auth.startAutoRefresh();
    void refreshSessionOnForeground();
    return;
  }

  supabase.auth.stopAutoRefresh();
}

/**
 * Su iOS/Android: avvia/ferma auto-refresh token in base a foreground/background.
 * Su web il browser gestisce già la visibilità.
 */
export function useSupabaseAuthAppState(): void {
  const isRegisteredRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    if (isRegisteredRef.current) {
      return;
    }

    isRegisteredRef.current = true;

    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
      void refreshSessionOnForeground();
    } else {
      supabase.auth.stopAutoRefresh();
    }

    const subscription = AppState.addEventListener('change', handleNativeAppStateChange);

    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
      isRegisteredRef.current = false;
    };
  }, []);
}
