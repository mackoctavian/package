import { create } from 'zustand'

type SelectedLocationState = {
  selectedLocationId?: string
  setSelectedLocationId: (id?: string) => void
}

export const useSelectedLocationStore = create<SelectedLocationState>((set) => ({
  selectedLocationId: undefined,
  setSelectedLocationId: (selectedLocationId) => set({ selectedLocationId }),
}))

