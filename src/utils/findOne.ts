import { db } from '@/config/db';
import { SQL } from 'drizzle-orm';

export async function findOne<T>(
  table: any,
  condition: SQL | undefined
): Promise<T | null> {
  const [row] = await db.select().from(table).where(condition!).limit(1);

  return row ?? null;
}
