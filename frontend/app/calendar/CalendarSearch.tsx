import { ChangeEvent, useCallback, useRef, useState, useEffect, FC } from 'react';

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

import { FilterModal } from '@/components/Modal';
import useCalendarStore from '@/store/calendarSlice';
import useFilterStore from '@/store/filterSlice';

import CalendarSearchResults from './CalendarSearchResults';

interface TermMap {
  [key: string]: string;
}

const terms: TermMap = {
  'Fall 2024': '1252',
  'Spring 2024': '1244',
  'Fall 2023': '1242',
  'Spring 2023': '1234',
  'Fall 2022': '1232',
  'Spring 2022': '1224',
  'Fall 2021': '1222',
  'Spring 2021': '1214',
  'Fall 2020': '1212',
};

const distributionAreas: TermMap = {
  'Social Analysis': 'SA',
  'Science & Engineering - Lab': 'SEL',
  'Science & Engineering - No Lab': 'SEN',
  'Quant & Comp Reasoning': 'QCR',
  'Literature and the Arts': 'LA',
  'Historical Analysis': 'HA',
  'Ethical Thought & Moral Values': 'EM',
  'Epistemology & Cognition': 'EC',
  'Culture & Difference': 'CD',
};

const levels: TermMap = {
  '100': '1',
  '200': '2',
  '300': '3',
  '400': '4',
  '500': '5',
};

const gradingBases: string[] = ['A-F', 'P/D/F', 'Audit'];

function buildQuery(searchQuery: string, filter: Filter): string {
  let queryString = `course=${encodeURIComponent(searchQuery)}`;

  if (filter.termFilter) {
    queryString += `&term=${encodeURIComponent(filter.termFilter)}`;
  }
  if (filter.distributionFilter) {
    queryString += `&distribution=${encodeURIComponent(filter.distributionFilter)}`;
  }
  if (filter.levelFilter.length > 0) {
    queryString += `&level=${filter.levelFilter.map(encodeURIComponent).join(',')}`;
  }
  if (filter.gradingFilter.length > 0) {
    queryString += `&grading=${filter.gradingFilter.map(encodeURIComponent).join(',')}`;
  }

  return queryString;
}

const searchCache = new LRUCache<string, Course[]>({
  maxSize: 50,
  entryExpirationTimeInMS: 1000 * 60 * 60 * 24,
});

function invert(obj: TermMap): TermMap {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [value, key]));
}

const CalendarSearch: FC = () => {
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [query, setQuery] = useState<string>('');
  const timerRef = useRef<number>();
  const {
    setCalendarSearchResults,
    calendarSearchResults,
    addRecentSearch,
    recentSearches,
    setError,
    setLoading,
  } = useCalendarStore((state) => ({
    setCalendarSearchResults: state.setCalendarSearchResults,
    calendarSearchResults: state.calendarSearchResults,
    addRecentSearch: state.addRecentSearch,
    recentSearches: state.recentSearches,
    setError: state.setError,
    setLoading: state.setLoading,
  }));

  const {
    termFilter,
    distributionFilter,
    levelFilter,
    gradingFilter,
    showPopup,
    setTermFilter,
    setDistributionFilter,
    setLevelFilter,
    setGradingFilter,
    setFilters,
    setShowPopup,
  } = useFilterStore();

  useEffect(() => {
    const storedFilters = localStorage.getItem('filter-settings');
    if (storedFilters) {
      const parsedFilters: Filter = JSON.parse(storedFilters);
      setFilters({
        termFilter: parsedFilters.termFilter || '',
        distributionFilter: parsedFilters.distributionFilter || '',
        levelFilter: parsedFilters.levelFilter || [],
        gradingFilter: parsedFilters.gradingFilter || [],
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'filter-settings',
      JSON.stringify({
        termFilter,
        distributionFilter,
        levelFilter,
        gradingFilter,
      })
    );
  }, [termFilter, distributionFilter, levelFilter, gradingFilter]);

  useEffect(() => {
    const storedShowPopup = localStorage.getItem('show-popup');
    if (storedShowPopup === 'true') {
      setShowPopup(true);
    }
  }, [setShowPopup]);

  useEffect(() => {
    localStorage.setItem('show-popup', showPopup.toString());
  }, [showPopup]);

  // TODO: is this needed?
  // useEffect(() => {
  //   setCalendarSearchResults(calendarSearchResults);
  // }, [calendarSearchResults, setCalendarSearchResults]);

  const search = useCallback(
    async (searchQuery: string, filter: Filter): Promise<void> => {
      setLoading(true);
      try {
        const queryString = buildQuery(searchQuery, filter);
        console.log('query is', queryString);
        const response = await fetch(`${process.env.BACKEND}/search/?${queryString}`);

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const data: { courses: Course[] } = await response.json();
        setCalendarSearchResults(data.courses);
        if (data.courses.length > 0) {
          addRecentSearch(searchQuery);
          searchCache.set(searchQuery, data.courses);
        }
      } catch (error: any) {
        setError(`There was an error fetching courses: ${error.message || ''}`);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setCalendarSearchResults, addRecentSearch, setError]
  );

  function retrieveCachedSearch(search: string) {
    setCalendarSearchResults(searchCache.get(search) || []);
  }

  useEffect(() => {
    const filters = {
      termFilter,
      distributionFilter,
      levelFilter,
      gradingFilter,
    };
    if (query) {
      search(query, filters);
    } else {
      search('', filters);
    }
  }, [query]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setQuery(event.target.value);
    }, 500);
  };

  const handleSave = useCallback(() => {
    const filters = {
      termFilter,
      distributionFilter,
      levelFilter,
      gradingFilter,
    };
    setFilters(filters);
    setShowPopup(false);
    localStorage.setItem('filter-settings', JSON.stringify(filters));
  }, [termFilter, distributionFilter, levelFilter, gradingFilter, setFilters, setShowPopup]);

  const handleCancel = useCallback(() => {
    setShowPopup(false);
  }, [setShowPopup]);

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
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPopup, handleSave, handleCancel]);

  const handleSettingsChange = (event) => {
    event.stopPropagation();
    setShowPopup(true);
  };

  const handleLevelFilterChange = (level) => {
    if (levelFilter.includes(level)) {
      setLevelFilter(levelFilter.filter((item) => item !== level));
    } else {
      setLevelFilter([...levelFilter, level]);
    }
  };

  const handleGradingFilterChange = (grading) => {
    if (gradingFilter.includes(grading)) {
      setGradingFilter(gradingFilter.filter((item) => item !== grading));
    } else {
      setGradingFilter([...gradingFilter, grading]);
    }
  };

  const modalContent =
    isClient && showPopup ? (
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
              value={termFilter ? invert(terms)[termFilter] : 'Fall 2024'}
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
              value={invert(distributionAreas)[distributionFilter]}
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
              {gradingBases.map((grading) => (
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
            className='block w-full py-1.5 pl-10 pr-3 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm'
            placeholder='Search courses'
            autoComplete='off'
            onChange={handleInputChange}
          />
          <button
            type='button'
            className='absolute inset-y-1 right-2 flex items-center justify-center px-1 rounded-md hover:bg-dnd-gray group'
            onClick={handleSettingsChange}
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
        <CalendarSearchResults courses={calendarSearchResults} />
      </div>
      {modalContent}
    </>
  );
};

export default CalendarSearch;
