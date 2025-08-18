import { prisma } from '~~/server/utils/prisma';
import { REST } from '@discordjs/rest';
import { APIGuild, APIUser, Routes } from 'discord-api-types/v10';
import { createAccessToken, createRefreshToken } from '~~/server/utils/token';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string;

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing code' });
  }

  const tokenResponse = await $fetch<{
    access_token: string;
    token_type: string;
  }>('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    }).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const discordRestApi = new REST({
    version: '10',
    authPrefix: 'Bearer',
  }).setToken(tokenResponse.access_token);
  const user = (await discordRestApi.get(Routes.user('@me'))) as APIUser;
  const guilds = (await discordRestApi.get(Routes.userGuilds())) as APIGuild[];

  const isInGuild = guilds.some(
    (guild) => guild.id === process.env.DISCORD_GUILD_ID
  );

  if (!isInGuild) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not a member of the required guild',
    });
  }

  const accessToken = await createAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);

  console.log('[SERVER] Upserting user');

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      avatarId: user.avatar,
      username: user.username,
    },
    create: {
      id: user.id,
      avatarId: user.avatar,
      username: user.username,
      refreshToken,
    },
  });

  console.log('[SERVER] User upserted successfully');

  setCookie(event, 'access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  setCookie(event, 'refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return sendRedirect(event, '/');
});
