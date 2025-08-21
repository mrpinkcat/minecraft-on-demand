import type { User } from '~/generated/prisma';

export default defineNuxtRouteMiddleware(async (to) => {
  console.log(
    `[CLIENT authMiddleware] Running auth middleware for ${
      to.path
    } (${to.name?.toString()}) route`
  );
  if (to.name === 'home') {
    console.log(
      `[CLIENT authMiddleware] Skipping auth check for ${
        to.path
      } (${to.name?.toString()}) route`
    );
    return;
  }
  const user = useState<User | undefined>('user');
  if (!user.value) {
    console.log(
      `[CLIENT authMiddleware] No user found, redirecting to home page`
    );
    return navigateTo({ name: 'home' });
  }
  console.log(`[CLIENT authMiddleware] User found, proceeding to ${to.path}`);
  return;
});
