import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { AcademicTerm, SemesterConfiguration } from '@/types';

import { distributionAreas, distributionAreasInverse } from '@/utils/distributionAreas';
import { grading } from '@/utils/grading';
import { levels } from '@/utils/levels';
import { terms, termsInverse } from '@/utils/terms';

interface FilterState {
  configurations: Record<number, SemesterConfiguration>;
  activeConfiguration: { semesterIndex: number };
  terms: Record<string, string>;
  termsInverse: Record<string, string>;
  distributionAreas: Record<string, string>;
  distributionAreasInverse: Record<string, string>;
  levels: Record<string, string>;
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
}

const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      configurations: {},
      activeConfiguration: { semesterIndex: 0 },
      terms,
      termsInverse,
      distributionAreas,
      distributionAreasInverse,
      grading,
      levels,
      termFilter: '',
      distributionFilter: '',
      levelFilter: [],
      gradingFilter: [],
      showPopup: false,

      setTermFilter: (term: string) => {
        console.log('Setting termFilter:', term);
        set({ termFilter: term });

        const { semesterIndex } = get().activeConfiguration;
        const semesterConfiguration = get().configurations[semesterIndex];
        if (semesterConfiguration) {
          const updatedTerm: AcademicTerm = {
            term_code: term,
            suffix: get().termsInverse[term],
          };
          set((state) => ({
            configurations: {
              ...state.configurations,
              [semesterIndex]: {
                ...semesterConfiguration,
                term: updatedTerm,
              },
            },
          }));
        }
      },

      setDistributionFilter: (distribution: string) => {
        console.log('Setting distributionFilter:', distribution);
        set({ distributionFilter: distribution });

        const { semesterIndex } = get().activeConfiguration;
        const semesterConfiguration = get().configurations[semesterIndex];
        if (semesterConfiguration) {
          set((state) => ({
            configurations: {
              ...state.configurations,
              [semesterIndex]: {
                ...semesterConfiguration,
                configurations: semesterConfiguration.schedule_configurations.map((config) => ({
                  ...config,
                  courses: config.courses.filter(
                    (course) => course.course.distribution_area_short === distribution
                  ),
                })),
              },
            },
          }));
        }
      },

      setLevelFilter: (level: string[]) => {
        console.log('Setting levelFilter:', level);
        set({ levelFilter: level });

        const { semesterIndex } = get().activeConfiguration;
        const semesterConfiguration = get().configurations[semesterIndex];
        if (semesterConfiguration) {
          set((state) => ({
            configurations: {
              ...state.configurations,
              [semesterIndex]: {
                ...semesterConfiguration,
                configurations: semesterConfiguration.schedule_configurations.map((config) => ({
                  ...config,
                  courses: config.courses.filter((course) =>
                    level.includes(String(Math.floor(course.course.catalog_number / 100) * 100))
                  ),
                })),
              },
            },
          }));
        }
      },

      setGradingFilter: (grading: string[]) => {
        console.log('Setting gradingFilter:', grading);
        set({ gradingFilter: grading });

        const { semesterIndex } = get().activeConfiguration;
        const semesterConfiguration = get().configurations[semesterIndex];
        if (semesterConfiguration) {
          set((state) => ({
            configurations: {
              ...state.configurations,
              [semesterIndex]: {
                ...semesterConfiguration,
                configurations: semesterConfiguration.schedule_configurations.map((config) => ({
                  ...config,
                  courses: config.courses.filter((event) =>
                    grading.includes(event.course.grading_basis)
                  ),
                })),
              },
            },
          }));
        }
      },

      setFilters: (filter) => {
        console.log('Setting filters:', filter);
        set({
          termFilter: filter.termFilter,
          distributionFilter: filter.distributionFilter,
          levelFilter: filter.levelFilter,
          gradingFilter: filter.gradingFilter,
        });

        const { semesterIndex } = get().activeConfiguration;
        const semesterConfiguration = get().configurations[semesterIndex];
        if (semesterConfiguration) {
          set((state) => ({
            configurations: {
              ...state.configurations,
              [semesterIndex]: {
                ...semesterConfiguration,
                term: {
                  term_code: filter.termFilter,
                  suffix: get().termsInverse[filter.termFilter],
                },
                configurations: semesterConfiguration.schedule_configurations.map((config) => ({
                  ...config,
                  courses: config.courses
                    .filter(
                      (event) => event.course.distribution_area_short === filter.distributionFilter
                    )
                    .filter((event) =>
                      filter.levelFilter.includes(
                        String(Math.floor(event.course.catalog_number / 100) * 100)
                      )
                    )
                    .filter((event) => filter.gradingFilter.includes(event.course.grading_basis)),
                })),
              },
            },
          }));
        }
      },

      setShowPopup: (show: boolean) => {
        console.log('Setting showPopup:', show);
        set({ showPopup: show });
      },

      resetFilters: () => {
        console.log('Resetting filters');
        set({
          termFilter: '',
          distributionFilter: '',
          levelFilter: [],
          gradingFilter: [],
        });

        const { semesterIndex } = get().activeConfiguration;
        const semesterConfiguration = get().configurations[semesterIndex];
        if (semesterConfiguration) {
          set((state) => ({
            configurations: {
              ...state.configurations,
              [semesterIndex]: {
                ...semesterConfiguration,
                term: {
                  term_code: '',
                  suffix: '',
                },
                configurations: semesterConfiguration.schedule_configurations.map((config) => ({
                  ...config,
                  courses: [],
                })),
              },
            },
          }));
        }
      },
    }),
    {
      name: 'filter-settings',
    }
  )
);

export default useFilterStore;
