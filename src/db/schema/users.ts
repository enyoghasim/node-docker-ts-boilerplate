import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';
// import { posts } from './posts';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// relation (can reference other tables)
// export const usersRelations = relations(users, ({ many }) => ({
//   posts: many(posts),
// }));
