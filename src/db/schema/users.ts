import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey().unique().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstname: varchar('firstname', { length: 120 }),
  lastname: varchar('lastname', { length: 120 }),
  password: varchar('password', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  hasVerifiedEmail: boolean('has_verified_email').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  googleId: varchar('google_id', { length: 255 }),
});
