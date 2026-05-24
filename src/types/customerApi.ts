export type CustomerSalon = {
  id: string;
  name: string;
  slug?: string;
  address?: string | null;
  city?: string | null;
};

export class CustomerApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'CustomerApiError';
    this.status = status;
    this.body = body;
  }
}

export type SalonsResponse = CustomerSalon[] | { salons: CustomerSalon[] };

export type CustomerService = {
  id: number;
  name: string;
  category_id: number | null;
  category_name: string | null;
  duration: number;
  price: number;
  color_code?: string | null;
};

export type ServicesResponse = { services: CustomerService[] };

export type CustomerStaff = {
  id: number;
  display_name: string;
  avatar_url?: string;
};

export type StaffResponse = { staff: CustomerStaff[] };

export type CustomerAvailabilitySlot = {
  start_time: string;
  end_time: string;
  staff_id: number;
};

export type AvailabilityResponse = { slots: CustomerAvailabilitySlot[] };

export type FetchAvailabilityParams = {
  salonId: string | number;
  serviceIds: (string | number)[];
  date: string;
  staffId?: string | number;
};

export type RequestCustomerClaimOtpPayload = {
  customer_code: string;
};

export type RequestCustomerClaimOtpResponse = {
  success: true;
  challenge_id: string;
  expires_at: string;
  delivery?: {
    channel: string;
    status: string;
    reason?: string;
  };
  _debug_otp?: string;
};

export type VerifyCustomerClaimOtpPayload = {
  customer_code: string;
  otp: string;
};

export type VerifyCustomerClaimOtpResponse = {
  success: true;
  customer_id: string;
  link_id: string | null;
};

export type CustomerClaimErrorBody = {
  success?: false;
  error?: string;
  code?: string;
  retry_after_sec?: number;
  attempts_remaining?: number;
};
