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
  const username = `${adj}${noun}${num}`;
  return username.slice(0, 50); // Ensure generated username is within limit
};