import { supabase } from '@/lib/supabase';

export type CustomerProfileName = {
  firstName: string | null;
  lastName: string | null;
};

type CustomerAuthLinkRow = {
  customer_id: string;
  customers:
    | { first_name: string | null; last_name: string | null }
    | { first_name: string | null; last_name: string | null }[]
    | null;
};

/**
 * Profilo anagrafica del cliente collegato (Supabase RLS, non Manager API).
 */
export async function fetchCustomerProfileName(): Promise<CustomerProfileName | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from('customer_auth_links')
    .select('customer_id, customers(first_name, last_name)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as CustomerAuthLinkRow;
  const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;

  if (!customer) {
    return null;
  }

  const firstName =
    customer.first_name != null && String(customer.first_name).trim()
      ? String(customer.first_name).trim()
      : null;
  const lastName =
    customer.last_name != null && String(customer.last_name).trim()
      ? String(customer.last_name).trim()
      : null;

  if (!firstName && !lastName) {
    return null;
  }

  return { firstName, lastName };
}
