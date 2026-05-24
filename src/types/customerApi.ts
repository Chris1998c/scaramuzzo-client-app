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

export type CreateBookingPayload = {
  salon_id: number;
  service_ids: number[];
  staff_id: number;
  start_time: string;
  notes?: string;
};

export type CustomerBookingService = {
  service_id: number;
  staff_id: number;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
};

export type CustomerBooking = {
  id: number;
  salon_id: number;
  start_time: string;
  end_time: string;
  status: string;
  source: string;
  notes: string | null;
  services: CustomerBookingService[];
};

export type CreateBookingResponse = {
  booking: CustomerBooking;
};

export type CustomerBookingListService = {
  service_id: number;
  service_name: string;
  staff_id: number | null;
  staff_name: string | null;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  vat_rate: number;
};

export type CustomerBookingListItem = {
  id: number;
  salon_id: number;
  salon_name: string;
  start_time: string;
  end_time: string;
  status: string;
  source: string;
  notes: string | null;
  services: CustomerBookingListService[];
};

export type BookingsListResponse = {
  bookings: CustomerBookingListItem[];
};

export type FetchBookingsParams = {
  status?: string;
  from?: string;
  to?: string;
  salonId?: number;
  limit?: number;
};

export type CancelBookingResponse = {
  booking: {
    id: number;
    status: 'cancelled';
  };
};

export type BookingTab = 'upcoming' | 'past' | 'cancelled';

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
