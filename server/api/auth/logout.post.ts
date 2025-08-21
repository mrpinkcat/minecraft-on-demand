import { eq } from 'drizzle-orm';
import { usersTable } from '~~/server/utils/drizzle/schema';
import { db } from '~~/server/utils/drizzle';

export default defineEventHandler(async (event) => {
  console.log('[SERVER] Received request to /api/auth/logout');
  const refreshToken = getCookie(event, 'refresh_token');

  if (refreshToken) {
    await db
      .update(usersTable)
      .set({ refreshToken: null })
      .where(eq(usersTable.refreshToken, refreshToken))
      .run();
  }

  deleteCookie(event, 'access_token');
  deleteCookie(event, 'refresh_token');

  delete event.context.user;

  setResponseStatus(event, 204);

  return;
});
