import type { User } from '~/generated/prisma';

export default defineNuxtPlugin((nuxtApp) => {
  useState<User>('user', () => nuxtApp.ssrContext?.event.context.user ?? null);
});
