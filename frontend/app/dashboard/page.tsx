'use client';

import { useEffect, useState, FC } from 'react';

import { useUser } from '@auth0/nextjs-auth0/client';
import SkeletonApp from '@/components/SkeletonApp';
import { useModalStore } from '@/store/modalSlice';
import { Canvas } from '@/app/dashboard/Canvas';
import { mapUserProfileToProfile } from '@/utils/profileMapper';
import { Profile } from '@/types'

const Dashboard: FC = () => {
  const { user, isLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  
  useEffect(() => {
    useModalStore.setState({ currentPage: 'dashboard' });
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const resolvedProfile = await mapUserProfileToProfile(user);
        setProfile(resolvedProfile);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <>
        <main className='flex flex-grow z-10 rounded pt-0.5vh pb-0.5vh pl-0.5vw pr-0.5vw'>
          {!isLoading && profile && profile.email !== '' ? (
            <Canvas user={profile} columns={2} />
          ) : (
            <div>
              <SkeletonApp />
            </div> // FIXME: We can replace this with a proper loading component or message
          )}
        </main>
    </>
  );
};

export default Dashboard;
