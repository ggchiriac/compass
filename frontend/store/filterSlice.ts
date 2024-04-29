import { create } from 'zustand';

import { fetchCsrfToken } from '@/utils/csrf';
import { distributionAreas, distributionAreasInverse } from '@/utils/distributionAreas';
import { grading } from '@/utils/grading';
import { levels } from '@/utils/levels';
import { terms, termsInverse } from '@/utils/terms';

interface FilterState {
  configurationId: string;
  configurations: { id: string; name: string }[];
  activeConfiguration: string;
  terms: { [key: string]: string };
  termsInverse: { [key: string]: string };
  distributionAreas: { [key: string]: string };
  distributionAreasInverse: { [key: string]: string };
  levels: { [key: string]: string };
  grading: string[];
  termFilter: string;
  currentPage: number;
  distributionFilter: string;
  levelFilter: string[];
  gradingFilter: string[];
  showPopup: boolean;
  setTermFilter: (term: string) => void;
  setCurrentPage: (page: number) => void;
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
  fetchFilters: (configurationId: string) => Promise<void>;
  saveFilters: (configurationId: string) => Promise<void>;
  fetchConfigurations: (termCode: string) => Promise<void>;
  setActiveConfiguration: (configurationId: string) => void;
  createConfiguration: (name: string) => Promise<void>;
  deleteConfiguration: (configurationId: string) => Promise<void>;
  renameConfiguration: (configurationId: string, newName: string) => Promise<void>;
}

const useFilterStore = create<FilterState>()((set, get) => ({
  configurationId: '',
  configurations: [],
  activeConfiguration: '',
  terms,
  termsInverse,
  distributionAreas,
  distributionAreasInverse,
  levels,
  grading,
  termFilter: '',
  currentPage: 1,
  distributionFilter: '',
  levelFilter: [],
  gradingFilter: [],
  showPopup: false,
  setTermFilter: (term) => {
    set({ termFilter: term });
    get().saveFilters(get().activeConfiguration);
  },
  setCurrentPage: (page) => {
    set({ currentPage: page });
  },
  setDistributionFilter: (distribution) => {
    set({ distributionFilter: distribution });
    get().saveFilters(get().activeConfiguration);
  },
  setLevelFilter: (level) => {
    set({ levelFilter: level });
    get().saveFilters(get().activeConfiguration);
  },
  setGradingFilter: (grading) => {
    set({ gradingFilter: grading });
    get().saveFilters(get().activeConfiguration);
  },
  setFilters: (filter) => {
    set({
      termFilter: filter.termFilter,
      distributionFilter: filter.distributionFilter,
      levelFilter: filter.levelFilter,
      gradingFilter: filter.gradingFilter,
    });
    get().saveFilters(get().activeConfiguration);
  },
  setShowPopup: (show) => set({ showPopup: show }),
  resetFilters: () => {
    set({
      termFilter: Object.values(terms)[Object.values(terms).length - 1],
      distributionFilter: '',
      levelFilter: [],
      gradingFilter: [],
    });
    get().saveFilters(get().activeConfiguration);
  },
  fetchFilters: async (configurationId: string) => {
    console.log('fetchfilters hit in filterslice');

    if (!configurationId) {
      console.error('Invalid configurationId');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.BACKEND}/fetch_calendar_configuration/${configurationId}/`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch filters');
      }

      const configuration = await response.json();
      const filters = configuration.filters;

      set({
        termFilter: filters.find((filter) => filter.filter_type === 'term')?.filter_value || '',
        distributionFilter:
          filters.find((filter) => filter.filter_type === 'distribution')?.filter_value || '',
        levelFilter: filters
          .filter((filter) => filter.filter_type === 'level')
          .map((filter) => filter.filter_value),
        gradingFilter: filters
          .filter((filter) => filter.filter_type === 'grading')
          .map((filter) => filter.filter_value),
      });
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  },

  saveFilters: async (configurationId: string) => {
    console.log('savefilters hit in filterslice');

    if (!configurationId) {
      console.error('Invalid configurationId');
      return;
    }

    console.log('Starting to save filters...', { configurationId });
    try {
      const csrfToken = await fetchCsrfToken();
      console.log('CSRF Token fetched for filters:', { csrfToken });

      const { termFilter, distributionFilter, levelFilter, gradingFilter } = get();
      const filters = [
        { filter_type: 'term', filter_value: termFilter },
        { filter_type: 'distribution', filter_value: distributionFilter },
        ...levelFilter.map((level) => ({ filter_type: 'level', filter_value: level })),
        ...gradingFilter.map((grading) => ({ filter_type: 'grading', filter_value: grading })),
      ];

      console.log('Prepared filters for PUT request:', { filters });

      const response = await fetch(
        `${process.env.BACKEND}/fetch_calendar_configuration/${configurationId}/`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify({
            filters: filters,
          }),
        }
      );

      console.log('Response status from saveFilters:', response.status);

      if (!response.ok) {
        throw new Error('Failed to save filters');
      }
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  },

  fetchConfigurations: async (termCode: string) => {
    console.log('fetchconfig hit in filterslice');

    try {
      const response = await fetch(
        `${process.env.BACKEND}/fetch_calendar_configurations/?term=${termCode}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }

      const configurations = await response.json();

      if (configurations.length === 0) {
        // No configurations found for the selected term, create a new one
        const termSuffix = get().termsInverse[termCode];
        const defaultConfigurationName = `${termSuffix} Configuration`;
        await get().createConfiguration(defaultConfigurationName);
      } else {
        const configurationObjects = configurations.map((config) => ({
          id: config.id,
          name: config.configuration,
        }));
        set({ configurations: configurationObjects });
        const activeConfigId = configurationObjects[0].id;
        set({ activeConfiguration: activeConfigId });
        get().fetchFilters(activeConfigId);
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
    }
  },

  setActiveConfiguration: (configurationId: string) => {
    console.log('setactiveconfig hit in filterslice');

    const configuration = get().configurations.find((config) => config.id === configurationId);
    if (configuration) {
      set({ activeConfiguration: configurationId });
      get().fetchFilters(configurationId);
    } else {
      console.error('Invalid configurationId');
    }
  },

  createConfiguration: async (name: string) => {
    console.log('createconfig hit in filterslice');
    console.log('Create Configuration - Name:', name);
    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(`${process.env.BACKEND}/fetch_calendar_configurations/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          term: selectedTerm,
          name: name,
          term: get().termFilter,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create configuration');
      }

      const newConfiguration = await response.json();
      set((state) => ({
        configurations: [
          ...state.configurations,
          { id: newConfiguration.id, name: newConfiguration.configuration },
        ],
        activeConfiguration: newConfiguration.id,
      }));
      get().fetchFilters(newConfiguration.id);
    } catch (error) {
      console.error('Error creating configuration:', error);
    }
  },

  deleteConfiguration: async (configurationId: string) => {
    console.log('deleteconfig hit in filterslice');

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(
        `${process.env.BACKEND}/fetch_calendar_configuration/${configurationId}/`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'X-CSRFToken': csrfToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      set((state) => ({
        configurations: state.configurations.filter((id) => id !== configurationId),
        activeConfiguration:
          state.activeConfiguration === configurationId
            ? state.configurations[0] || ''
            : state.activeConfiguration,
      }));
    } catch (error) {
      console.error('Error deleting configuration:', error);
    }
  },

  renameConfiguration: async (configurationId: string, newName: string) => {
    console.log('rename hit in filterslice');

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(
        `${process.env.BACKEND}/fetch_calendar_configuration/${configurationId}/`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify({ configuration: newName }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to rename configuration');
      }
    } catch (error) {
      console.error('Error renaming configuration:', error);
    }
  },
}));

export default useFilterStore;
