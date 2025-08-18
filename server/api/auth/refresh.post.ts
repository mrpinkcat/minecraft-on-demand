import { verifyRefreshToken, createAccessToken } from '~~/server/utils/token';
import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token');
  if (!refreshToken) {
    throw createError({ statusCode: 401, statusMessage: 'No refresh token' });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user || user.refreshToken !== refreshToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid refresh token',
      });
    }

    const newAccessToken = await createAccessToken(user.id);

    setCookie(event, 'access_token', newAccessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { accessToken: newAccessToken };
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid refresh token',
    });
  }
});
