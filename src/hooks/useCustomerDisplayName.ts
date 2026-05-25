import { useQuery } from '@tanstack/react-query';

import { formatGreetingLabel } from '@/lib/formatDisplayName';
import {
  customerProfileNameQueryKey,
  profileLinkQueryKey,
} from '@/lib/queryKeys';
import { fetchCustomerProfileName } from '@/services/customerProfile';
import { useAuthStore } from '@/store/authStore';

export function useCustomerDisplayName() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = Boolean(user);

  const { data: profileName, isLoading } = useQuery({
    queryKey: customerProfileNameQueryKey,
    queryFn: fetchCustomerProfileName,
    enabled: isLoggedIn,
    staleTime: 5 * 60_000,
  });

  const greeting = formatGreetingLabel({
    firstName: profileName?.firstName,
    lastName: profileName?.lastName,
    email: user?.email,
  });

  return {
    greeting,
    profileName,
    isProfileNameLoading: isLoggedIn && isLoading,
  };
}

/** Invalida insieme al check profilo collegato. */
export function customerDisplayQueryKeys() {
  return [profileLinkQueryKey, customerProfileNameQueryKey] as const;
}
