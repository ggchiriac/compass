// TODO: This does not need to be a Zustand store since we can manage local states
// and "global" (intra-page) states with useState.

// Leaving it as an artifact of early HoagiePlan for now, but this should be ticketed soon. --Windsor

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { distributionAreas, distributionAreasInverse } from '@/utils/distributionAreas';
import { grading } from '@/utils/grading';
import { levels } from '@/utils/levels';
import { terms, termsInverse } from '@/utils/terms';

interface FilterState {
  terms: { [key: string]: string };
  termsInverse: { [key: string]: string };
  distributionAreas: { [key: string]: string };
  distributionAreasInverse: { [key: string]: string };
  levels: { [key: string]: string };
  grading: string[];
  termFilter: string;
  distributionFilter: string;
  levelFilter: string[];
  gradingFilter: string[];
  showPopup: boolean;
  setTermFilter: (term: string) => void;
  setDistributionFilter: (distribution: string) => void;
  setLevelFilter: (level: string[]) => void;
  setGradingFilter: (grading: string[]) => void;
  setFilters: (filter: {
    termFilter: string;
    distributionFilter: string;
    levelFilter: string[];
    gradingFilter: string[];
  }) => void;
  setShowPopup: (show: boolean) => void;
  resetFilters: () => void;
  areFiltersEmpty: () => boolean;
}

const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      terms,
      termsInverse,
      distributionAreas,
      distributionAreasInverse,
      levels,
      grading,

      termFilter: '',
      distributionFilter: '',
      levelFilter: [],
      gradingFilter: [],
      showPopup: false,
      setTermFilter: (term) => set({ termFilter: term }),
      setDistributionFilter: (distribution) => set({ distributionFilter: distribution }),
      setLevelFilter: (level) => set({ levelFilter: level }),
      setGradingFilter: (grading) => set({ gradingFilter: grading }),
      setFilters: (filter) => set(filter),
      setShowPopup: (show) => set({ showPopup: show }),
      resetFilters: () => {
        set({
          termFilter: '',
          distributionFilter: '',
          levelFilter: [],
          gradingFilter: [],
        });
      },
      areFiltersEmpty: () => {
        const { termFilter, distributionFilter, levelFilter, gradingFilter } = get();
        return (
          termFilter === '' &&
          distributionFilter === '' &&
          levelFilter.length === 0 &&
          gradingFilter.length === 0
        );
      },
    }),
    {
      name: 'filter-settings',
    }
  )
);

export default useFilterStore;
