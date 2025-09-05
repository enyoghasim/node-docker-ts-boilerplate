import { Service } from 'typedi';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findOne } from '@/utils/findOne'; // path to your helper
import { db } from '@/config/db';

@Service()
export class UserService {
  async findById(id: number) {
    return findOne<typeof users.$inferSelect>(users, eq(users.id, id));
  }

  async findByEmail(email: string) {
    return findOne<typeof users.$inferSelect>(users, eq(users.email, email));
  }

  async create(user: typeof users.$inferInsert) {
    return db.insert(users).values(user).returning();
  }

  async update(id: number, user: Partial<typeof users.$inferInsert>) {
    return db.update(users).set(user).where(eq(users.id, id)).returning();
  }
}
