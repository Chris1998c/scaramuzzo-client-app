import type { CustomerAvailabilitySlot, CustomerBooking } from '@/types/customerApi';
import { create } from 'zustand';

type BookingState = {
  selectedSalonId: string | number | null;
  selectedSalonName: string | null;
  selectedServiceIds: (string | number)[];
  selectedStaffId: string | number | null;
  selectedStaffName: string | null;
  selectedDate: string | null;
  selectedSlot: CustomerAvailabilitySlot | null;
  notes: string;
  lastCreatedBooking: CustomerBooking | null;
  setSalon: (id: string | number, name: string) => void;
  toggleService: (id: string | number) => void;
  clearServices: () => void;
  setStaff: (id: string | number, name: string) => void;
  setDate: (date: string) => void;
  setSlot: (slot: CustomerAvailabilitySlot) => void;
  clearSlot: () => void;
  setNotes: (notes: string) => void;
  setLastCreatedBooking: (booking: CustomerBooking | null) => void;
  resetBooking: () => void;
};

const initialState = {
  selectedSalonId: null,
  selectedSalonName: null,
  selectedServiceIds: [] as (string | number)[],
  selectedStaffId: null,
  selectedStaffName: null,
  selectedDate: null,
  selectedSlot: null,
  notes: '',
  lastCreatedBooking: null as CustomerBooking | null,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,
  setSalon: (id, name) => {
    const currentId = get().selectedSalonId;
    const isSameSalon = currentId !== null && String(currentId) === String(id);

    set({
      selectedSalonId: id,
      selectedSalonName: name,
      selectedServiceIds: isSameSalon ? get().selectedServiceIds : [],
      ...(isSameSalon
        ? {}
        : {
            selectedStaffId: null,
            selectedStaffName: null,
            selectedDate: null,
            selectedSlot: null,
            notes: '',
            lastCreatedBooking: null,
          }),
    });
  },
  toggleService: (id) => {
    const ids = get().selectedServiceIds;
    const isSelected = ids.some((item) => String(item) === String(id));

    set({
      selectedServiceIds: isSelected
        ? ids.filter((item) => String(item) !== String(id))
        : [...ids, id],
      selectedSlot: null,
    });
  },
  clearServices: () =>
    set({
      selectedServiceIds: [],
      selectedSlot: null,
    }),
  setStaff: (id, name) =>
    set({
      selectedStaffId: id,
      selectedStaffName: name,
      selectedSlot: null,
    }),
  setDate: (date) =>
    set({
      selectedDate: date,
      selectedSlot: null,
    }),
  setSlot: (slot) => set({ selectedSlot: slot }),
  clearSlot: () => set({ selectedSlot: null }),
  setNotes: (notes) => set({ notes }),
  setLastCreatedBooking: (booking) => set({ lastCreatedBooking: booking }),
  resetBooking: () => set(initialState),
}));
