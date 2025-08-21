import { verifyAccessToken } from '~~/server/utils/token';
import { prisma } from '~~/server/utils/prisma';
import type { User } from '~~/app/generated/prisma';

declare module 'h3' {
  interface H3EventContext {
    user?: User;
  }
}

export default defineEventHandler(async (event) => {
  console.log(
    '[SERVER authMiddleware] Running auth middleware for',
    event.path
  );

  const token = getCookie(event, 'access_token');
  if (!token) {
    delete event.context.user; // Clear user if no token
    console.log(
      '[SERVER authMiddleware] No access token found, no user context for ' +
        event.path
    );
  } else {
    try {
      const { userId } = await verifyAccessToken(token);
      console.log(
        '[SERVER authMiddleware] Access token verified, fetching user from database for userId: ' +
          userId
      );
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      console.log(
        '[SERVER authMiddleware] User fetched from database and set in context for userId: ' +
          userId
      );
      if (!user) {
        console.warn(
          '[SERVER authMiddleware] User not found in database for userId: ' +
            userId
        );
        delete event.context.user; // Clear user if no token
      }
      if (user) {
        event.context.user = user;
      }
    } catch {
      console.warn('Token verification failed');
      delete event.context.user; // Clear user if no token
      deleteCookie(event, 'access_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
  }
});
