import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import {
  CustomerApiError,
  type CustomerSalon,
  type RequestCustomerClaimOtpPayload,
  type RequestCustomerClaimOtpResponse,
  type SalonsResponse,
  type ServicesResponse,
  type CustomerService,
  type CustomerStaff,
  type StaffResponse,
  type CustomerAvailabilitySlot,
  type AvailabilityResponse,
  type FetchAvailabilityParams,
  type VerifyCustomerClaimOtpPayload,
  type VerifyCustomerClaimOtpResponse,
} from '@/types/customerApi';

export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function customerFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!config.managerApiUrl) {
    throw new CustomerApiError('EXPO_PUBLIC_MANAGER_API_URL is not configured', 0);
  }

  const token = await getAuthToken();
  const baseUrl = config.managerApiUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let body: unknown;

    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => undefined);
    }

    const message =
      typeof body === 'object' && body !== null
        ? 'error' in body && body.error
          ? String((body as { error: unknown }).error)
          : 'message' in body && body.message
            ? String((body as { message: unknown }).message)
            : `Request failed with status ${response.status}`
        : `Request failed with status ${response.status}`;

    throw new CustomerApiError(message, response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function parseSalonsResponse(data: SalonsResponse): CustomerSalon[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.salons ?? [];
}

export async function fetchSalons(): Promise<CustomerSalon[]> {
  const data = await customerFetch<SalonsResponse>('/api/customer/v1/salons');
  return parseSalonsResponse(data);
}

export async function fetchServices(salonId: string | number): Promise<CustomerService[]> {
  const data = await customerFetch<ServicesResponse>(
    `/api/customer/v1/services?salon_id=${encodeURIComponent(String(salonId))}`,
  );
  return data.services ?? [];
}

export async function fetchStaff(
  salonId: string | number,
  serviceId?: string | number,
): Promise<CustomerStaff[]> {
  const params = new URLSearchParams({ salon_id: String(salonId) });

  if (serviceId !== undefined) {
    params.set('service_id', String(serviceId));
  }

  const data = await customerFetch<StaffResponse>(`/api/customer/v1/staff?${params.toString()}`);
  return data.staff ?? [];
}

export async function fetchAvailability({
  salonId,
  serviceIds,
  date,
  staffId,
}: FetchAvailabilityParams): Promise<CustomerAvailabilitySlot[]> {
  const params = new URLSearchParams({
    salon_id: String(salonId),
    date,
  });

  for (const id of serviceIds) {
    params.append('service_ids', String(id));
  }

  if (staffId !== undefined) {
    params.set('staff_id', String(staffId));
  }

  const data = await customerFetch<AvailabilityResponse>(
    `/api/customer/v1/availability?${params.toString()}`,
  );

  return data.slots ?? [];
}

export async function requestCustomerClaimOtp(
  payload: RequestCustomerClaimOtpPayload,
): Promise<RequestCustomerClaimOtpResponse> {
  return customerFetch<RequestCustomerClaimOtpResponse>('/api/customer/claim/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyCustomerClaimOtp(
  payload: VerifyCustomerClaimOtpPayload,
): Promise<VerifyCustomerClaimOtpResponse> {
  return customerFetch<VerifyCustomerClaimOtpResponse>('/api/customer/claim/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
