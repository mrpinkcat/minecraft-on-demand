import { verifyAccessToken } from '~~/server/utils/token';
import { prisma } from '~~/server/utils/prisma';
import type { User } from '~~/app/generated/prisma';

declare module 'h3' {
  interface H3EventContext {
    user?: User;
  }
}

export default defineEventHandler(async (event) => {
  console.log('[SERVER] Running auth middleware');
  const token = getCookie(event, 'access_token');
  if (!token) {
    console.warn('[SERVER] No access token found in cookies');
    return; // No token, no user
  }
  console.log(
    '[SERVER] Access token found, proceeding with verification' + token
  );

  try {
    console.log('[SERVER] Verifying access token');
    const { userId } = await verifyAccessToken(token);
    console.log('[SERVER] Access token verified, fetching user from database');
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      console.warn('[SERVER] User not found in database');
      delete event.context.user; // Clear user if not found
      return;
    }
    if (user) {
      console.log('[SERVER] User found:', user);
      event.context.user = user;
    }
  } catch {
    console.warn('Token verification failed');
    delete event.context.user;
  }
});
