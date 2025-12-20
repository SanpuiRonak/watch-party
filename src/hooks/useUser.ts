'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setUser } from '@/lib/store/slices/userSlice';
import { loadUser, saveUser, generateUsername, generateAvatar } from '@/lib/utils/userStorage';
import { User } from '@/lib/types';

export const useUser = () => {
  const dispatch = useAppDispatch();
  const { currentUser, isAuthenticated } = useAppSelector(state => state.user);

  useEffect(() => {
    const storedUser = loadUser();
    if (storedUser) {
      dispatch(setUser(storedUser));
    }
  }, [dispatch]);

  const createUser = (username?: string, avatar?: string): User => {
    const newUser: User = {
      id: crypto.randomUUID(),
      username: username || generateUsername(),
      avatar: avatar || generateAvatar(),
    };
    
    dispatch(setUser(newUser));
    saveUser(newUser);
    return newUser;
  };

  return {
    user: currentUser,
    isAuthenticated,
    createUser,
  };
};