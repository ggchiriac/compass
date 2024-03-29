import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { SearchStoreState } from '@/types';

const useSearchStore = create<SearchStoreState>()(
  persist(
    (set) => ({
      searchResults: [],
      recentSearches: [],
      error: null,
      loading: false,
      setSearchResults: (results) => set({ searchResults: results }),
      addRecentSearch: (query) => {
        let trimmedQuery = query.trim();
        if (trimmedQuery.length === 0) {
          return;
        }
        trimmedQuery = trimmedQuery.length > 120 ? trimmedQuery.slice(0, 120) : trimmedQuery;
        set((state) => {
          const updatedRecentSearches = [...new Set([trimmedQuery, ...state.recentSearches])].slice(
            0,
            5
          );
          return { recentSearches: updatedRecentSearches };
        });
      },
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),
      searchFilter: {
        termFilter: '',
        distributionFilter: '',
        levelFilter: [],
        gradingFilter: [],
      },
      setSearchFilter: (filter) => set(() => ({ searchFilter: filter })),
    }),
    {
      name: 'search-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useSearchStore;
