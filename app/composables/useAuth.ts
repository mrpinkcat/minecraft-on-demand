import type { MeUser } from '~~/server/api/me.get';

export const useAuth = () => {
  const user = useState<MeUser | null>('auth_user', () => null);
  const loading = useState('auth_loading', () => false);

  // Charger l'utilisateur
  const fetchUser = async () => {
    loading.value = true;
    console.log('Fetching user data...');
    try {
      console.log('Making request to /api/me');
      const data = await $fetch<MeUser>('/api/me');
      console.log('User data fetched:', data);
      user.value = data ?? null;
    } catch {
      console.log('Failed to fetch user data, setting user to null');
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Déconnexion
  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' });
    user.value = null;
  };

  // Refresh manuel (si besoin)
  const refresh = async () => {
    try {
      await $fetch('/api/auth/refresh', { method: 'POST' });
      await fetchUser();
    } catch {
      user.value = null;
    }
  };

  return { user, loading, fetchUser, logout, refresh };
};
