import session from 'express-session';
import { redis } from './redis';
import { RedisStore } from 'connect-redis';

export default session({
  name: process.env.SESSION_COOKIE_NAME!,
  secret: process.env.SESSION_SECRET!,
  store: new RedisStore({ client: redis }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production', // set to true if using HTTPS
    httpOnly: process.env.NODE_ENV === 'production', // prevent client-side JS from reading the cookie
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict', // CSRF protection
  },
});
