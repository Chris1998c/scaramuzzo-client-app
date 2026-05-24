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
  type CreateBookingPayload,
  type CreateBookingResponse,
  type CustomerBooking,
  type CustomerBookingListItem,
  type BookingsListResponse,
  type FetchBookingsParams,
  type CancelBookingResponse,
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

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function createBooking(payload: CreateBookingPayload): Promise<CustomerBooking> {
  const body: Record<string, unknown> = {
    salon_id: payload.salon_id,
    service_ids: payload.service_ids,
    staff_id: payload.staff_id,
    start_time: payload.start_time,
  };

  if (payload.notes?.trim()) {
    body.notes = payload.notes.trim();
  }

  const data = await customerFetch<CreateBookingResponse>('/api/customer/v1/bookings', {
    method: 'POST',
    headers: {
      'Idempotency-Key': generateIdempotencyKey(),
    },
    body: JSON.stringify(body),
  });

  return data.booking;
}

export async function fetchBookings(
  params?: FetchBookingsParams,
): Promise<CustomerBookingListItem[]> {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.set('status', params.status);
  }

  if (params?.from) {
    searchParams.set('from', params.from);
  }

  if (params?.to) {
    searchParams.set('to', params.to);
  }

  if (params?.salonId !== undefined) {
    searchParams.set('salon_id', String(params.salonId));
  }

  if (params?.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }

  const query = searchParams.toString();
  const path = `/api/customer/v1/bookings${query ? `?${query}` : ''}`;
  const data = await customerFetch<BookingsListResponse>(path);

  return data.bookings ?? [];
}

export async function cancelBooking(
  bookingId: number,
): Promise<CancelBookingResponse['booking']> {
  const data = await customerFetch<CancelBookingResponse>(
    `/api/customer/v1/bookings/${bookingId}`,
    { method: 'DELETE' },
  );

  return data.booking;
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
