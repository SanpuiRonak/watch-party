import { useUser } from '@/hooks/useUser';

export function WelcomeMessage() {
  const { user, isAuthenticated } = useUser();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground">
      Welcome back, {user.username}!
    </p>
  );
}
