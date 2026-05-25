import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useSupabaseAuthAppState } from '@/hooks/useSupabaseAuthAppState';
import { clearCustomerSessionState } from '@/lib/clearCustomerSessionState';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type AppProvidersProps = {
  children: ReactNode;
};

function AuthInitializer({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);

  useSupabaseAuthAppState();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) {
        return;
      }

      previousUserIdRef.current = session?.user?.id ?? null;
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;
      const previousUserId = previousUserIdRef.current;

      const signedOut = event === 'SIGNED_OUT' || (nextUserId === null && previousUserId !== null);
      const switchedAccount =
        nextUserId !== null &&
        previousUserId !== null &&
        nextUserId !== previousUserId;

      if (signedOut || switchedAccount) {
        clearCustomerSessionState(queryClient);
      }

      setSession(session);
      previousUserIdRef.current = nextUserId;
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, queryClient]);

  return children;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60_000,
            throwOnError: false,
          },
          mutations: {
            throwOnError: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  );
}
