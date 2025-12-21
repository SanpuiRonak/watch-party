import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getInitials = (username: string): string => {
  return username
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (username: string): string => {
  const colors = [
    'bg-red-500',
    'bg-blue-500', 
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ];
  
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm', 
  lg: 'w-10 h-10 text-base'
};

export function UserAvatar({ username, size = 'md', className }: UserAvatarProps) {
  const initials = getInitials(username);
  const colorClass = getAvatarColor(username);
  
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center text-white font-medium',
      colorClass,
      sizeClasses[size],
      className
    )}>
      {initials}
    </div>
  );
}