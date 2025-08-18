type MeUser = {
  id: string;
  username: string;
  avatarUrl?: string;
};

export type { MeUser };

export default defineEventHandler(async (event) => {
  console.log('[SERVER] Received request to /api/me');
  if (!event.context.user) {
    console.log(
      '[SERVER] No user found in context, returning 401 Unauthorized'
    );
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  console.log('[SERVER] User found in context:', event.context.user);
  const user: MeUser = {
    id: event.context.user.id,
    username: event.context.user.username,
    avatarUrl: event.context.user.avatarId
      ? `https://cdn.discordapp.com/avatars/${event.context.user.id}/${event.context.user.avatarId}.png`
      : undefined,
  };
  return user;
});
