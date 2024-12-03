import { create } from "zustand";

interface ModalStore {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (seen: boolean) => void;
}

const getLocalStorageValue = (key: string, defaultValue: any) => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  currentPage: "home",
  setCurrentPage: (page) => set({ currentPage: page }),
  hasSeenTutorial: getLocalStorageValue("hasSeenTutorial", false),
  setHasSeenTutorial: (seen) => {
    set({ hasSeenTutorial: seen });
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenTutorial", JSON.stringify(seen));
    }
  },
}));
