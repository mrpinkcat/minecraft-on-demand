import type { InferSelectModel } from 'drizzle-orm';
import { usersTable } from '~~/server/utils/drizzle/schema';

export const useUser = () =>
  useState<InferSelectModel<typeof usersTable> | undefined>('user');
