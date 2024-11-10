import { UserProfile } from '@auth0/nextjs-auth0/client';
import { Profile, MajorMinorType } from '@/types';

/**
 * Fetch user profile data from the backend.
 * @param netId - The user's netId to query the backend.
 * @returns A Profile object if found, or null if not authenticated.
 */
async function fetchCustomUser(netId: string): Promise<Profile | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/profile/`, {
      method: 'GET',
      headers: {
        'X-NetId': netId,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('User not authenticated.');
        return null;
      }
      if (response.status === 404) {
        console.error('User profile not found.');
        return null;
      }
      throw new Error(`Error fetching CustomUser: ${response.statusText}`);
    }

    const data = await response.json();
    return data as Profile;
  } catch (error) {
    console.error('Error fetching CustomUser:', error);
    return null;
  }
}

/**
 * Map a UserProfile object from Auth0 to a Profile object.
 * If user data exists in the backend, it will override defaults.
 * @param userProfile - The Auth0 UserProfile object.
 * @returns A Profile object mapped from Auth0 and backend data.
 */
export const mapUserProfileToProfile = async (userProfile: UserProfile | null): Promise<Profile> => {
  if (!userProfile) {
    throw new Error('UserProfile is null or undefined.');
  }

  const [firstName, lastName] = (userProfile.name || '').split(' ');
  const netId = userProfile.nickname || '';
  const email = userProfile.sub?.split('|')[2] || '';

  const defaultMajor: MajorMinorType = { code: 'Undeclared', name: 'Undeclared' };

  const user = await fetchCustomUser(netId);

  return {
    firstName: user?.firstName || firstName || '',
    lastName: user?.lastName || lastName || '',
    classYear: user?.classYear || new Date().getFullYear() + 1,
    major: user?.major || defaultMajor,
    minors: user?.minors || [],
    certificates: user?.certificates || [],
    netId: user?.netId || netId,
    universityId: user?.universityId || netId || '',
    email: user?.email || email,
    department: user?.department || 'Undeclared',
    timeFormat24h: user?.timeFormat24h || false,
    themeDarkMode: user?.themeDarkMode || false,
  };
};
