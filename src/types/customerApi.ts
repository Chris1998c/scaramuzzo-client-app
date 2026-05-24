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
