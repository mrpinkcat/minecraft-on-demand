import { db } from '~~/server/utils/drizzle';
import { REST } from '@discordjs/rest';
import { APIGuild, APIUser, Routes } from 'discord-api-types/v10';
import { createAccessToken, createRefreshToken } from '~~/server/utils/token';
import { usersTable } from '~~/server/utils/drizzle/schema';
import { createUserNamespace } from '~~/server/utils/kubernetes/namespace';
import { eq } from 'drizzle-orm';

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
  const discordUser = (await discordRestApi.get(Routes.user('@me'))) as APIUser;
  const discordUserGuilds = (await discordRestApi.get(
    Routes.userGuilds()
  )) as APIGuild[];

  const isInGuild = discordUserGuilds.some(
    (guild) => guild.id === process.env.DISCORD_GUILD_ID
  );

  if (!isInGuild) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not a member of the required guild',
    });
  }

  const accessToken = await createAccessToken(discordUser.id);
  const refreshToken = await createRefreshToken(discordUser.id);

  const user = await db
    .insert(usersTable)
    .values({
      id: discordUser.id,
      avatarId: discordUser.avatar,
      username: discordUser.username,
      refreshToken,
    })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        avatarId: discordUser.avatar,
        username: discordUser.username,
        refreshToken,
      },
    })
    .returning()
    .get();

  event.context.user = user;

  console.log('[SERVER] User data updated/saved in database');

  setCookie(event, 'access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60, // 15 minutes
  });
  setCookie(event, 'refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  console.log('[SERVER] Cookies set successfully');

  const namespace = await createUserNamespace(event.context);

  console.log('[SERVER] User namespace created');

  await db
    .update(usersTable)
    .set({ namespace: namespace.metadata?.name })
    .where(eq(usersTable.id, discordUser.id))
    .run();

  console.log('[SERVER] User namespace updated in database');

  return sendRedirect(event, '/app');
});
