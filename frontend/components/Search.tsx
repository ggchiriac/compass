import { ChangeEvent, useRef, useState, useEffect, useCallback, FC } from 'react';

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import {
  Button,
  Checkbox,
  Autocomplete,
  FormLabel,
  AutocompleteOption,
  ListItemContent,
} from '@mui/joy';
import { LRUCache } from 'typescript-lru-cache';

import { Course, Filter } from '@/types';

import useSearchStore from '@/store/searchSlice';
import { distributionAreas, distributionAreasInverse } from '@/utils/distributionAreas';
import { grading } from '@/utils/grading';
import { levels } from '@/utils/levels';
import { terms, termsInverse } from '@/utils/terms';

import { FilterModal } from './Modal';

const searchCache = new LRUCache<string, Course[]>({
  maxSize: 50,
  entryExpirationTimeInMS: 1000 * 60 * 60 * 24,
});

const Search: FC = () => {
  const [query, setQuery] = useState<string>('');
  const timerRef = useRef<number>();
  const { setSearchResults, searchResults, addRecentSearch, recentSearches, setError, setLoading } =
    useSearchStore((state) => ({
      setSearchResults: state.setSearchResults,
      searchResults: state.searchResults,
      addRecentSearch: state.addRecentSearch,
      recentSearches: state.recentSearches,
      setError: state.setError,
      setLoading: state.setLoading,
    }));
  const { searchFilter, setSearchFilter } = useSearchStore();

  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [termFilter, setTermFilter] = useState(searchFilter.termFilter || '');
  const [distributionFilter, setDistributionFilter] = useState(
    searchFilter.distributionFilter || ''
  );
  const [levelFilter, setLevelFilter] = useState(searchFilter.levelFilter || []);
  const [gradingFilter, setGradingFilter] = useState(searchFilter.gradingFilter || []);

  useEffect(() => {
    setSearchResults(searchResults);
  }, [searchResults, setSearchResults]);

  const search = async (searchQuery: string, filter: Filter) => {
    setLoading(true);
    try {
      let queryString = `course=${encodeURIComponent(searchQuery)}`;

      if (filter.termFilter) {
        queryString += `&term=${encodeURIComponent(filter.termFilter)}`;
      }

      if (filter.distributionFilter) {
        queryString += `&distribution=${encodeURIComponent(filter.distributionFilter)}`;
      }

      if (filter.levelFilter.length > 0) {
        queryString += `&level=${filter.levelFilter.map((item) => encodeURIComponent(item)).join(',')}`;
      }

      if (filter.gradingFilter.length > 0) {
        queryString += `&grading=${filter.gradingFilter.map((item) => encodeURIComponent(item)).join(',')}`;
      }

      const response = await fetch(`${process.env.BACKEND}/search/?${queryString}`);
      if (response.ok) {
        const data: { courses: Course[] } = await response.json();
        setSearchResults(data.courses);
        if (data.courses.length > 0) {
          addRecentSearch(searchQuery);
          searchCache.set(searchQuery, data.courses);
        }
      } else {
        setError(`Server returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setError('There was an error fetching courses.');
    } finally {
      setLoading(false);
    }
  };

  function retrieveCachedSearch(search) {
    setSearchResults(searchCache.get(search) ?? []);
  }

  useEffect(() => {
    if (query) {
      search(query, searchFilter);
    } else {
      search('', searchFilter);
    }
  }, [query, searchFilter]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setQuery(event.target.value);
    }, 500);
  };

  const handleSave = useCallback(() => {
    const filter = {
      termFilter,
      distributionFilter,
      levelFilter,
      gradingFilter,
    };
    setSearchFilter(filter);
    setShowPopup(false);
  }, [termFilter, distributionFilter, levelFilter, gradingFilter, setSearchFilter, setShowPopup]);

  const handleCancel = useCallback(() => {
    setTermFilter(searchFilter.termFilter);
    setDistributionFilter(searchFilter.distributionFilter);
    setLevelFilter(searchFilter.levelFilter);
    setGradingFilter(searchFilter.gradingFilter);
    setShowPopup(false);
  }, [
    searchFilter,
    setTermFilter,
    setDistributionFilter,
    setLevelFilter,
    setGradingFilter,
    setShowPopup,
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        handleSave();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        handleCancel();
      }
    };

    if (showPopup) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Remove event listener if showPopup is false, or on unmount.
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPopup, handleSave, handleCancel]);

  const handleAdjustmentsClick = (event) => {
    event.stopPropagation();
    setShowPopup(true);
  };

  const handleLevelFilterChange = (level) => {
    if (levelFilter.includes(level)) {
      setLevelFilter((levelFilter) => levelFilter.filter((item) => item !== level));
    } else {
      setLevelFilter((levelFilter) => [...levelFilter, level]);
    }
  };

  const handleGradingFilterChange = (grading) => {
    if (gradingFilter.includes(grading)) {
      setGradingFilter((gradingFilter) => gradingFilter.filter((item) => item !== grading));
    } else {
      setGradingFilter((gradingFilter) => [...gradingFilter, grading]);
    }
  };

  const modalContent = showPopup ? (
    <FilterModal
      setShowPopup={setShowPopup}
      setTermFilter={setTermFilter}
      setDistributionFilter={setDistributionFilter}
      setLevelFilter={setLevelFilter}
      setGradingFilter={setGradingFilter}
      handleSave={handleSave}
      handleCancel={handleCancel}
    >
      <div className='grid grid-cols-1 gap-6'>
        <div>
          <FormLabel>Semester</FormLabel>
          <Autocomplete
            multiple={false}
            autoHighlight
            options={Object.keys(terms)}
            placeholder='Semester'
            variant='soft'
            value={termsInverse[termFilter]}
            isOptionEqualToValue={(option, value) => value === '' || option === value}
            onChange={(event, newTermName: string | null) => {
              event.stopPropagation();
              setTermFilter(terms[newTermName ?? ''] ?? '');
            }}
            getOptionLabel={(option) => option.toString()}
            renderOption={(props, option) => (
              <AutocompleteOption {...props} key={option}>
                <ListItemContent>{option}</ListItemContent>
              </AutocompleteOption>
            )}
          />
        </div>
        <div>
          <FormLabel>Distribution area</FormLabel>
          <Autocomplete
            multiple={false}
            autoHighlight
            options={Object.keys(distributionAreas)}
            placeholder='Distribution area'
            variant='soft'
            value={distributionAreasInverse[distributionFilter]}
            isOptionEqualToValue={(option, value) => value === '' || option === value}
            onChange={(event, newDistributionName: string | null) => {
              event.stopPropagation();
              setDistributionFilter(distributionAreas[newDistributionName ?? ''] ?? '');
            }}
            getOptionLabel={(option) => option.toString()}
            renderOption={(props, option) => (
              <AutocompleteOption {...props} key={option}>
                <ListItemContent>{option}</ListItemContent>
              </AutocompleteOption>
            )}
          />
        </div>
        <div>
          <FormLabel>Course level</FormLabel>
          <div className='grid grid-cols-3'>
            {Object.keys(levels).map((level) => (
              <div key={level} className='flex items-center mb-2'>
                <Checkbox
                  size='sm'
                  id={`level-${level}`}
                  name='level'
                  checked={levelFilter.includes(levels[level])}
                  onChange={() => handleLevelFilterChange(levels[level])}
                />
                <span className='ml-2 text-sm font-medium text-gray-800'>{level}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <FormLabel>Allowed grading</FormLabel>
          <div className='grid grid-cols-3'>
            {grading.map((grading) => (
              <div key={grading} className='flex items-center mb-2'>
                <Checkbox
                  size='sm'
                  id={`grading-${grading}`}
                  name='grading'
                  checked={gradingFilter.includes(grading)}
                  onChange={() => handleGradingFilterChange(grading)}
                />
                <span className='ml-2 text-sm font-medium text-gray-800'>{grading}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer className='mt-auto text-right'>
        <div className='mt-5 text-right'>
          <Button variant='soft' color='primary' onClick={handleSave} size='md'>
            Save
          </Button>
          <Button variant='soft' color='neutral' onClick={handleCancel} sx={{ ml: 2 }} size='md'>
            Cancel
          </Button>
        </div>
      </footer>
    </FilterModal>
  ) : null;

  return (
    <>
      <div className='block w-full text-left pr-3'>
        <label htmlFor='search' className='sr-only'>
          Search courses
        </label>
        <div className='relative mt-2 rounded-lg shadow-sm'>
          <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
            <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
          </div>
          <input
            type='text'
            name='search'
            id='search'
            className='block w-full py-1.5 pl-10 pr-9 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-600 focus:border-indigo-600'
            placeholder='Search courses'
            autoComplete='off'
            onChange={handleInputChange}
          />
          <button
            type='button'
            className='absolute inset-y-1 right-2 flex items-center justify-center px-1 rounded-md hover:bg-dnd-gray group'
            onClick={handleAdjustmentsClick}
            aria-label='Adjust search settings'
          >
            <AdjustmentsHorizontalIcon
              className='h-5 w-5 text-gray-400 group-hover:text-gray-500'
              aria-hidden='true'
            />
          </button>
        </div>
        <div className='mt-3'>
          <div className='text-sm font-medium text-gray-500'>Recent searches:</div>
          <div className='flex overflow-x-auto py-2 space-x-2'>
            {recentSearches.map((search, index) => (
              <button
                key={index}
                className='bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-0.5 px-2 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300'
                onClick={() => retrieveCachedSearch(search)}
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </div>
      {modalContent}
    </>
  );
};

export default Search;
