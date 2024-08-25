import { FC } from 'react';

import useAuthStore from '@/store/authSlice';

export const Logout: FC = () => {
  const logout = useAuthStore((state) => state.logout); // TODO: INTEGRATE NEW AUTH

  return <button onClick={logout}>Log Out</button>;
};
