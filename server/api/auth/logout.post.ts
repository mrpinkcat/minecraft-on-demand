import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  console.log('[SERVER] Received request to /api/auth/logout');
  const refreshToken = getCookie(event, 'refresh_token');

  if (refreshToken) {
    await prisma.user.updateMany({
      where: { refreshToken },
      data: { refreshToken: undefined },
    });
  }

  deleteCookie(event, 'access_token');
  deleteCookie(event, 'refresh_token');

  delete event.context.user;

  setResponseStatus(event, 204);

  return;
});
