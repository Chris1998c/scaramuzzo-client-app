import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import {
  CustomerApiError,
  type CustomerSalon,
  type RequestCustomerClaimOtpByPhonePayload,
  type RequestCustomerClaimOtpByPhoneResponse,
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
  type VerifyCustomerClaimOtpByPhonePayload,
  type VerifyCustomerClaimOtpByPhoneResponse,
} from '@/types/customerApi';

const SESSION_EXPIRED_MESSAGE = "Sessione scaduta. Effettua di nuovo l'accesso.";
const SESSION_EXPIRED_UI_MESSAGE = 'Sessione scaduta. Esci e accedi di nuovo.';

function resolveApiErrorMessage(status: number, rawMessage: string): string {
  if (status === 401) {
    if (
      rawMessage === SESSION_EXPIRED_MESSAGE ||
      rawMessage.startsWith('Request failed with status 401')
    ) {
      return SESSION_EXPIRED_UI_MESSAGE;
    }
  }

  return rawMessage;
}

function extractErrorMessage(body: unknown, status: number): string {
  const fallback = `Request failed with status ${status}`;

  if (typeof body !== 'object' || body === null) {
    return resolveApiErrorMessage(status, fallback);
  }

  if ('error' in body && body.error) {
    return resolveApiErrorMessage(status, String((body as { error: unknown }).error));
  }

  if ('message' in body && body.message) {
    return resolveApiErrorMessage(status, String((body as { message: unknown }).message));
  }

  return resolveApiErrorMessage(status, fallback);
}

export async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return session.access_token;
  }

  const { data: refreshed } = await supabase.auth.refreshSession();

  if (refreshed.session?.access_token) {
    return refreshed.session.access_token;
  }

  throw new CustomerApiError(SESSION_EXPIRED_MESSAGE, 401);
}

export async function customerFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!config.managerApiUrl) {
    throw new CustomerApiError('EXPO_PUBLIC_MANAGER_API_URL is not configured', 0);
  }

  const token = await getAuthToken();
  const baseUrl = config.managerApiUrl.trim().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;
  const method = (options.method ?? 'GET').toUpperCase();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const { headers: _ignoredHeaders, ...fetchOptions } = options;

  let response: Response;

  try {
    response = await fetch(url, {
      ...fetchOptions,
      method,
      headers,
    });
  } catch {
    throw new CustomerApiError(
      'Connessione non disponibile. Controlla la rete e riprova.',
      0,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    let body: unknown;
    let bodyText: string | undefined;

    try {
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else {
        bodyText = await response.text();
        body = bodyText;
      }
    } catch {
      body = undefined;
    }

    if (
      response.status === 401 &&
      (contentType.includes('text/html') || typeof bodyText === 'string')
    ) {
      throw new CustomerApiError(
        'Il backend Manager non è raggiungibile dall\'app (protezione Vercel sul deploy preview o URL errato). Usa l\'URL di produzione o disabilita la protezione del deployment.',
        401,
        body,
      );
    }

    const message = extractErrorMessage(body, response.status);

    throw new CustomerApiError(message, response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new CustomerApiError(
      'Connessione non disponibile. Controlla la rete e riprova.',
      0,
    );
  }
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

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function createBooking(
  payload: CreateBookingPayload,
  idempotencyKey: string,
): Promise<CustomerBooking> {
  const key = idempotencyKey.trim();

  if (!key) {
    throw new Error('createBooking requires a non-empty Idempotency-Key');
  }

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
      'Idempotency-Key': key,
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

export async function requestCustomerClaimOtpByPhone(
  payload: RequestCustomerClaimOtpByPhonePayload,
): Promise<RequestCustomerClaimOtpByPhoneResponse> {
  return customerFetch<RequestCustomerClaimOtpByPhoneResponse>(
    '/api/customer/claim/request-otp-by-phone',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function verifyCustomerClaimOtpByPhone(
  payload: VerifyCustomerClaimOtpByPhonePayload,
): Promise<VerifyCustomerClaimOtpByPhoneResponse> {
  return customerFetch<VerifyCustomerClaimOtpByPhoneResponse>(
    '/api/customer/claim/verify-otp-by-phone',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
