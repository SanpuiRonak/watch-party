import { User } from '@/lib/types';

const USER_STORAGE_KEY = 'watch-party-user';

export const saveUser = (user: User): void => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const loadUser = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const clearUser = (): void => {
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const generateUsername = (): string => {
  const adjectives = ['Cool', 'Happy', 'Swift', 'Bright', 'Clever', 'Bold'];
  const nouns = ['Panda', 'Tiger', 'Eagle', 'Shark', 'Wolf', 'Fox'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
};

export const generateAvatar = (): string => {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];
  return colors[Math.floor(Math.random() * colors.length)];
};