import { useQuery } from '@tanstack/react-query';

import { profileLinkQueryKey } from '@/lib/queryKeys';
import { fetchSalons } from '@/services/customerApi';
import { useAuthStore } from '@/store/authStore';
import { CustomerApiError } from '@/types/customerApi';

export function useProfileLinkStatus() {
  const session = useAuthStore((state) => state.session);
  const isLoggedIn = Boolean(session);

  const { data, error, isLoading } = useQuery({
    queryKey: profileLinkQueryKey,
    queryFn: fetchSalons,
    enabled: isLoggedIn,
    retry: (failureCount, err) => {
      if (err instanceof CustomerApiError && err.status === 403) {
        return false;
      }

      return failureCount < 1;
    },
  });

  const isProfileUnlinked =
    error instanceof CustomerApiError && error.status === 403;
  const isProfileLinked = isLoggedIn && !isLoading && !error && Boolean(data);

  return {
    isLoggedIn,
    isProfileLinked,
    isProfileUnlinked,
    isProfileLoading: isLoggedIn && isLoading,
    profileError: error,
    salons: data,
  };
}
