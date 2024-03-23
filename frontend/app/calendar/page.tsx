'use client';

import { useEffect, useState, FC } from 'react';

import Calendar from '../../components/Calendar/Calendar';
import CalendarSearch from '../../components/Calendar/CalendarSearch';
import Footer from '../../components/Footer';
import Navbar from '../../components/Navbar';
import SkeletonApp from '../../components/SkeletonApp';
import useAuthStore from '../../store/authSlice';
import UserState from '../../store/userSlice';

const Kairos: FC = () => {
  const [isLoading, setIsLoading] = useState(true);
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
          {/* Adjust CalendarSearch container to control width and overflow */}
          <div className='flex-none w-full lg:max-w-xs p-4 overflow-y-auto'>
            <CalendarSearch />
          </div>
          {/* Adjust Calendar to use available space */}
          <div className='flex-grow p-4'>
            {!isLoading && userProfile && userProfile.netId !== '' ? (
              <Calendar />
            ) : (
              <SkeletonApp /> // Placeholder for loading state
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Kairos;
