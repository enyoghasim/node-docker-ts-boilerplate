import { Service } from 'typedi';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findOne } from '@/utils/findOne'; // path to your helper

@Service()
export class UserService {
  async findById(id: number) {
    return findOne<typeof users.$inferSelect>(users, eq(users.id, id));
  }

  async findByEmail(email: string) {
    return findOne<typeof users.$inferSelect>(users, eq(users.email, email));
  }
}
