export default defineEventHandler((event) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    response_type: 'code',
    scope: 'identify guilds',
  });

  return sendRedirect(
    event,
    `https://discord.com/api/oauth2/authorize?${params.toString()}`
  );
});
