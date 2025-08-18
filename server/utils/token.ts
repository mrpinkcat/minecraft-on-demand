import { SignJWT, jwtVerify } from 'jose';

const accessTokenSecret = new TextEncoder().encode(process.env.JWT_SECRET!);
const refreshTokenSecret = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET!
);

export async function createAccessToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessTokenSecret);
}

export async function createRefreshToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshTokenSecret);
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, accessTokenSecret);
    return payload as { userId: string };
  } catch (error) {
    console.error('Access token verification failed:', error);
    throw new Error('Invalid access token');
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, refreshTokenSecret);
    return payload as { userId: string };
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    throw new Error('Invalid refresh token');
  }
}
