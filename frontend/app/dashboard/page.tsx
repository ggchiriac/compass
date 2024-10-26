'use client';

import { useEffect, useState, FC } from 'react';

import { useUser } from '@auth0/nextjs-auth0/client';
import SkeletonApp from '@/components/SkeletonApp';
import { useModalStore } from '@/store/modalSlice';
import { Canvas } from '@/app/dashboard/Canvas';

const Dashboard: FC = () => {
  const { user, error, isLoading } = useUser();
  
  useEffect(() => {
    useModalStore.setState({ currentPage: 'dashboard' });
  });

  return (
    <>
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
        <main className='flex flex-grow bg-[#FAFAFA] shadow-xl z-10 rounded pt-0.5vh pb-0.5vh pl-0.5vw pr-0.5vw'>
          {!isLoading && user && user.nickname !== '' ? (
            <Canvas user={user} columns={2} />
          ) : (
            <div>
              <SkeletonApp />
            </div> // FIXME: We can replace this with a proper loading component or message
          )}
        </main>
      </div>
    </>
  );
};

export default Dashboard;
