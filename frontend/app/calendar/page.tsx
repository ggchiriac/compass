'use client';

import { useEffect, useState, FC } from 'react';

import Calendar from '../../components/Calendar/Calendar';
import CalendarSearch from '../../components/Calendar/CalendarSearch';
import Footer from '../../components/Footer';
// import LoadingComponent from '../../components/LoadingComponent';
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
        <div className='absolute inset-x-0 -top-40 z-0 transform-gpu overflow-hidden blur-3xl sm:-top-80'>
          {/* Gradient div omitted for brevity */}
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
