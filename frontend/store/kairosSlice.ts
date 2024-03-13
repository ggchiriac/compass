import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useKairosStore = create(
  persist(
    (set) => ({
      selectedItems: [],
      calendarSearchResults: [],
      addItem: (item) => {
        console.log('Adding item:', item);
        set((state) => ({
          selectedItems: [...(state.selectedItems || []), item],
        }));
      },
      setCalendarSearchResults: (results) => {
        set({ calendarSearchResults: results });
      },
    }),
    {
      name: 'kairos-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useKairosStore;
