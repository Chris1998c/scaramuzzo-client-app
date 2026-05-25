/** Prefisso condiviso: tutte le query cliente (prenotazioni, profilo, catalogo). */
export const customerQueryKeyRoot = ['customer'] as const;

export const profileLinkQueryKey = [...customerQueryKeyRoot, 'profile-link'] as const;

export const customerProfileNameQueryKey = [...customerQueryKeyRoot, 'profile-name'] as const;

export const customerBookingsQueryKey = [...customerQueryKeyRoot, 'bookings'] as const;

export const customerSalonsQueryKey = [...customerQueryKeyRoot, 'salons'] as const;
