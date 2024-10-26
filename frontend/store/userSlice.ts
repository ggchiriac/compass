import { useEffect } from 'react';
import { create } from 'zustand';
import { UserState, Claims, Profile } from '@/types';

// Function to extract profile information from Auth0 user session
function getProfileFromUser(user: Claims): Profile {
  const [firstName, lastName] = user.name.split(' ');

  return {
    firstName,
    lastName,
    netId: user.nickname, // Assuming `nickname` is the NetID
    email: user.sub.split('|').pop() || '', // Extract email from `sub` (after the last pipe symbol)
    department: 'COS', // Placeholder, adjust as needed
    timeFormat24h: false, // Assuming default 12-hour format
    themeDarkMode: false, // Assuming default light mode
    major: undefined,
    minors: [],
    certificates: [],
    classYear: undefined,
    universityId: '',
  };
}

// Create Zustand store
const useUserSlice = create<UserState>((set) => ({
  profile: {
    firstName: '',
    lastName: '',
    major: undefined,
    minors: [],
    certificates: [],
    classYear: undefined,
    netId: '',
    universityId: '',
    email: '',
    department: '',
    themeDarkMode: false,
    timeFormat24h: false,
  },
  updateProfile: (updates: Partial<Profile>) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),
}));

// Custom hook to fetch user profile and update Zustand store
export const useFetchUserProfile = (user: Claims | null) => {
  const updateStore = useUserSlice((state) => state.updateProfile);

  useEffect(() => {
    if (user) {
      const profile = getProfileFromUser(user);
      updateStore(profile); // Update the store with the user profile
    }
  }, [user, updateStore]);
};

export default useUserSlice;
