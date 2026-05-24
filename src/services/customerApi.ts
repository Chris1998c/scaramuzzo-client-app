import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import {
  CustomerApiError,
  type CustomerSalon,
  type SalonsResponse,
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
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
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
