'use client';

import { useEffect, useState, FC } from 'react';

// import styles from '@/components/Container/Container.module.scss';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SkeletonApp from '@/components/SkeletonApp';
import tabbedMenu from '@/components/TabbedMenu/TabbedMenu.module.scss';
import useAuthStore from '@/store/authSlice';
import UserState from '@/store/userSlice';

import './Calendar.scss';
import Calendar from './Calendar';
// import CalendarSearch from './CalendarSearch';

const CalendarUI: FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { checkAuthentication } = useAuthStore((state) => state);
  const userProfile = UserState((state) => state.profile);

  useEffect(() => {
    checkAuthentication().then(() => setIsLoading(false));
  }, [checkAuthentication]);

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
          <div className='flex w-full h-full'>
            {/* Left Section for Search and Requirements */}
            {/* <div className='w-64 bg-white border-r border-gray-200 p-4'> */}

            {/* <div className={styles.Container} style={{ width: '360px' }}>
              <CalendarSearch />
            </div> */}

            {/* Center Section for Calendar */}
            <div className='flex-grow p-4'>
              {!isLoading && userProfile && userProfile.netId !== '' ? (
                <Calendar />
              ) : (
                <SkeletonApp />
              )}
            </div>

            {/* Right Section for Event Details */}
            <div className={tabbedMenu.tabContainer} style={{ width: '15%' }}>
              <div className={tabbedMenu.tabContent}>
                <div className='text-sm font-medium text-gray-500'>
                  <strong> Calendar features </strong> will be available soon. Stay tuned!
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default CalendarUI;
