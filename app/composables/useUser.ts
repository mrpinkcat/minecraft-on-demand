import type { InferSelectModel } from 'drizzle-orm';
import { usersTable } from '~~/db/schema';

export const useUser = () =>
  useState<InferSelectModel<typeof usersTable> | undefined>('user');
