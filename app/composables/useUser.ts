import type { User } from '~/generated/prisma';

export const useUser = () => useState<User | undefined>('user');
