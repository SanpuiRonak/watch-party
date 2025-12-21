export const validateAndTruncateUsername = (username: string): string => {
  if (!username || typeof username !== 'string') {
    return 'Anonymous';
  }
  
  return username.trim().slice(0, 50) || 'Anonymous';
};