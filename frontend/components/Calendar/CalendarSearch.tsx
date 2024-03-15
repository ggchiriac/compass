import { useRef, useState, useEffect, FC } from 'react';

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { LRUCache } from 'typescript-lru-cache';

import { Course } from '@/types';

import useKairosStore from '@/store/kairosSlice';

import CalendarList from './CalendarList';

const searchCache = new LRUCache<string, Course[]>({
  maxSize: 50,
  entryExpirationTimeInMS: 1000 * 60 * 60 * 24,
});

const CalendarSearch: FC = () => {
  const [query, setQuery] = useState<string>('');
  const timerRef = useRef<number>();
  const {
    setCalendarSearchResults,
    calendarSearchResults,
    addRecentSearch,
    recentSearches,
    setError,
    setLoading,
  } = useKairosStore((state) => ({
    setCalendarSearchResults: state.setCalendarSearchResults,
    calendarSearchResults: state.calendarSearchResults,
    addRecentSearch: state.addRecentSearch,
    recentSearches: state.recentSearches,
    setError: state.setError,
    setLoading: state.setLoading,
  }));

  useEffect(() => {
    setCalendarSearchResults(calendarSearchResults);
  }, [calendarSearchResults, setCalendarSearchResults]);

  const search = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.BACKEND}/search/?course=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data: { courses: Course[] } = await response.json();
        setCalendarSearchResults(data.courses);
        addRecentSearch(searchQuery);
        searchCache.set(searchQuery, data.courses);
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
    setCalendarSearchResults(searchCache.get(search));
  }

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [query]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setQuery(event.target.value);
    }, 500);
  };

  return (
    <div>
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
      <CalendarList items={calendarSearchResults} />
    </div>
  );
};

export default CalendarSearch;
