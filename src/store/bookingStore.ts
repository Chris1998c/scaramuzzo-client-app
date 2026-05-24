import type { CustomerAvailabilitySlot } from '@/types/customerApi';
import { create } from 'zustand';

type BookingState = {
  selectedSalonId: string | number | null;
  selectedSalonName: string | null;
  selectedServiceIds: (string | number)[];
  selectedStaffId: string | number | null;
  selectedStaffName: string | null;
  selectedDate: string | null;
  selectedSlot: CustomerAvailabilitySlot | null;
  setSalon: (id: string | number, name: string) => void;
  toggleService: (id: string | number) => void;
  clearServices: () => void;
  setStaff: (id: string | number, name: string) => void;
  setDate: (date: string) => void;
  setSlot: (slot: CustomerAvailabilitySlot) => void;
  clearSlot: () => void;
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
  resetBooking: () => set(initialState),
}));
