'use client';

import { useEffect, useState, FC } from 'react';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SkeletonApp from '@/components/SkeletonApp';
import useAuthStore from '@/store/authSlice';
import useSearchStore from '@/store/searchSlice';
import UserState from '@/store/userSlice';

import Calendar from './Calendar';
import CalendarSearch from './CalendarSearch';

const Kairos: FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { checkAuthentication } = useAuthStore((state) => state);
  const userProfile = UserState((state) => state.profile);
  const searchResults = useSearchStore((state) => state.searchResults);

  useEffect(() => {
    checkAuthentication().then(() => setIsLoading(false));
  }, [checkAuthentication]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    margin: '10px',
    borderRadius: '6px',
    transition: 'background-color 350ms ease',
    backgroundColor: 'rgba(246, 246, 246, 1)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    fontSize: '1em',
    overflowY: 'auto',
    height: '703px',
  };

  const searchWrapperStyle: React.CSSProperties = {
    display: 'flex',
    height: '30px',
    boxSizing: 'border-box',
    position: 'relative',
  };

  const itemStyle: React.CSSProperties = {
    position: 'relative',
    height: '30px',
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
    padding: '15px 15px',
    backgroundImage: 'linear-gradient(to bottom, var(--color_primary), var(--color_secondary))',
    boxShadow:
      '0 0 0 calc(1px / var(--scale-x, 1)) rgba(63, 63, 68, 0.05), 0 1px calc(3px / var(--scale-x, 1)) 0 rgba(34, 33, 81, 0.15)',
    outline: 'none',
    borderRadius: 'calc(4px / var(--scale-x, 1))',
    boxSizing: 'border-box',
    listStyle: 'none',
    transform: 'scale(var(--scale, 1))',
    transition: 'box-shadow 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  };

  const textContainerStyle: React.CSSProperties = {
    display: 'inline-block',
    color: '#ffffff',
    fontWeight: 400,
    fontSize: '1rem',
    flexGrow: 1,
    overflow: 'hidden',
  };

  const renderCourseItem = (course) => {
    return (
      <div style={itemStyle}>
        <div style={textContainerStyle}>
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
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {/* Left Section for Search Results */}
            <div style={{ width: '360px' }}>
              <div style={containerStyle}>
                <CalendarSearch />
                {searchResults.map((course, index) => (
                  <div key={index} style={searchWrapperStyle}>
                    {renderCourseItem(course)}
                  </div>
                ))}
              </div>
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

export default Kairos;
