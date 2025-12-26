'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setUser, clearUser } from '@/lib/store/slices/userSlice';
import { User } from '@/lib/types';

export const useUser = () => {
  const dispatch = useAppDispatch();
  const { currentUser, isAuthenticated } = useAppSelector(state => state.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch session from API on mount (cookie-based authentication)
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include', // Important: Include cookies
        });
        
        if (response.ok) {
          const { authenticated, user } = await response.json();
          if (authenticated && user) {
            dispatch(setUser(user));
          }
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSession();
  }, [dispatch]);

  const logout = async () => {
    try {
      await fetch('/api/auth/delete-user', {
        method: 'DELETE',
        credentials: 'include', // Important: Include cookies
      });
      dispatch(clearUser());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user: currentUser,
    isAuthenticated,
    isLoading,
    logout,
  };
};
