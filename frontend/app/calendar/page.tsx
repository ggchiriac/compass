'use client';

import { useEffect, useState, FC } from 'react';

import styles from '@/components/Container/Container.module.scss';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SkeletonApp from '@/components/SkeletonApp';
import useAuthStore from '@/store/authSlice';
import useSearchStore from '@/store/searchSlice';
import UserState from '@/store/userSlice';

import Calendar from './Calendar';
import CalendarSearch from './CalendarSearch';

const CalendarUI: FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { checkAuthentication } = useAuthStore((state) => state);
  const userProfile = UserState((state) => state.profile);
  const searchResults = useSearchStore((state) => state.searchResults);

  useEffect(() => {
    checkAuthentication().then(() => setIsLoading(false));
  }, [checkAuthentication]);

  const renderCourseItem = (course) => {
    return (
      <div className={styles.Item}>
        <div className={styles.TextContainer}>
          <h3>{course.title}</h3>
          <p>{course.code}</p>
          {/* Add more course details */}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className='flex flex-col min-h-screen pt-24'>
        {/* Background Gradient Effect */}
        <div
          className='absolute inset-x-0 -top-40 z-0 transform-gpu overflow-hidden blur-3xl sm:-top-80'
          aria-hidden='true'
        >
          <div
            className='relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]'
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        <main className='flex flex-grow bg-[#FAFAFA] shadow-xl z-10 rounded-lg overflow-hidden'>
          <div className='flex'>
            {/* Left Section for Search Results */}
            <div className={styles.Container} style={{ width: '360px' }}>
              <CalendarSearch />
              {/* Render search results here */}
              <ul>
                {searchResults.map((course, index) => (
                  <li key={index}>{renderCourseItem(course)}</li>
                ))}
              </ul>
            </div>

            {/* Center Section for Calendar */}
            <div className='flex-grow p-4'>
              {!isLoading && userProfile && userProfile.netId !== '' ? (
                <Calendar />
              ) : (
                <SkeletonApp /> // Placeholder for loading state
              )}
            </div>

            {/* Right section for requirements */}
            <div style={{ width: '240px' }}>{/* Gonna add stretch goal tuners here soon */}</div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default CalendarUI;
