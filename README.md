## Luxestay API - README

This document explains how to run the Luxestay API project locally, the environment variables required, what the npm/yarn scripts do, and common troubleshooting steps.

---

## Quick summary / plan

- Purpose: Run the API locally (with or without Docker), run migrations, and develop using the TypeScript source.
- Two main workflows:
  - Local Node workflow (fast iteration): `yarn dev` (uses `gulp` + `ts-node` + `nodemon`)
  - Containerized workflow: `yarn compose:up` (uses Docker Compose and the `.env.development.local` file)

---

## Checklist of important files

- `package.json` - npm/yarn scripts and dependencies.
- `gulpfile.js` - build/dev tasks (compile, watch, dev with ts-node).
- `Dockerfile.dev` - development Docker image.
- `docker-compose.yaml` - compose orchestration (build services, networks).
- `src/config/env.ts` - the app loads `.env.development.local` when NODE_ENV=development. Create that file in the project root.

---

## Prerequisites

- Node.js (recommended: 18+). This project lists Node 22 in the Dockerfile; for local development Node 18+ or 20+ is fine.
- Yarn (project uses Yarn v1 in package.json). If you prefer npm you can translate the commands.
- Docker & Docker Compose (if you want to run the containerized workflow).

## Environment files

The app resolves environment from `src/config/env.ts`. When `NODE_ENV` is `development` the app loads `.env.development.local` from the project root. For production it loads `.env`.

Create a file named `.env.development.local` at the project root with the variables described below. Keep it out of git (add to `.gitignore`) if it contains secrets.

Important: the app does not provide defaults for several required variables — you should set them before starting the app.

---

## Environment variables

Fill these in your `.env.development.local` (or `.env`) file.

- NODE_ENV: development | production (default: development)
- PORT: the HTTP port the app listens on (e.g. 3000)

- DATABASE_HOST: Postgres host (e.g. localhost or postgres)
- DATABASE_PORT: Postgres port (e.g. 5432)
- DATABASE_USER: Postgres username
- DATABASE_PASSWORD: Postgres password
- DATABASE_NAME: Postgres database name
- DATABASE_SSL: 'true' to enable SSL, otherwise not

- REDIS_HOST: Redis hostname
- REDIS_PORT: Redis port (default 6379)
- REDIS_PASSWORD: Redis password (optional)

- RABBITMQ_URL: (optional) AMQP URL like amqp://user:pass@host:port
  - OR -
  - RABBITMQ_HOST: host
  - RABBITMQ_PORT: port
  - RABBITMQ_USER: user (optional)
  - RABBITMQ_PASSWORD: password (optional)
  - RABBITMQ_RETRY_ATTEMPTS: integer (optional, default 10)
  - RABBITMQ_RETRY_DELAY_MS: integer ms (optional, default 1000)

- SESSION_COOKIE_NAME: name for session cookie (e.g. sid)
- SESSION_SECRET: secret used to sign session cookies (required)

- MAIL_QUEUE: RabbitMQ queue name for outbound mail processing (default: mail:send)
- RESEND_API_KEY: API key for Resend (used by mailer worker, optional if you use another provider)
- MAIL_FROM: canonical from address used when sending mail (e.g. no-reply@example.com)
- FROM_NAME: display name for sender (e.g. Luxestay)
- APP_NAME: application name used in emails (optional)

- GOOGLE_OAUTH_CLIENT_ID: used by Google OAuth validation (optional)
- GOOGLE_OAUTH_CLIENT_SECRET: used by Google OAuth flows (optional)

Notes:

- `SESSION_SECRET` and any API keys are required for secure operation. Do not commit them.
- `PORT` must be set. The server reads `process.env.PORT` and will fail if not provided.

---

## Common commands and what they do

All commands below are the Yarn scripts defined in `package.json`. Run them from the project root.

- yarn dev
  - Runs `gulp` which executes `nodemon` -> `ts-node` on `src/index.ts`.
  - Use this for local development with automatic reloads when you change TypeScript files.

- yarn build
  - Runs `gulp build` which compiles TypeScript into `dist/` (via `gulp-typescript`) and copies non-ts files.

- yarn start
  - Runs `node dist/app.js`. Use this after `yarn build` to start the compiled app.

- yarn clean
  - Deletes the `dist/` folder (implemented as `rm -rf dist` in the gulpfile).

- yarn lint
  - Runs ESLint on `src/**/*.ts` to find issues.

- yarn lint:fix
  - Runs ESLint with `--fix` to automatically fix fixable issues.

- yarn format
  - Runs Prettier to format source files.

Docker / Compose related (development oriented):

- yarn compose:up
  - Runs: `docker compose --env-file .env.development.local up --build`
  - Builds and starts services defined in `docker-compose.yaml` using the `.env.development.local` file.

- yarn compose:down
  - Tears down the compose stack used above.

- yarn compose:logs
  - Tail logs for the compose services: `docker compose --env-file .env.development.local logs -f`

- yarn compose:install
  - Installs dependencies inside the container's `node_modules` by running the `installer` service once (as configured in `docker-compose.yaml`).
  - Use this when you need the container to have its own installed dependencies (for example when the host `node_modules` are missing or when you want deterministic in-container installs).

- yarn compose:generate
  - Runs `npx drizzle-kit generate` inside the `app` service. Used to generate schema artifacts.

- yarn compose:migrate
  - Runs `npx drizzle-kit migrate` inside the `app` service.

- yarn compose:push
  - Runs `npx drizzle-kit push` inside the `app` service to apply migrations.

- yarn compose:studio
  - Runs the Drizzle Studio inside the container (if configured).

Database local commands (drizzle-kit based):

- yarn db:generate
  - Runs `drizzle-kit generate:pg` locally (requires drizzle-kit installed).

- yarn db:migrate
  - Runs `drizzle-kit push:pg` locally.

- yarn db:studio
  - Runs `drizzle-kit studio` locally.

---

## How to run locally (step-by-step)

1. Install dependencies (locally):

```bash
yarn install
```

2. Create `.env.development.local` in the project root and populate required variables (see above).

3a. Fast local development (no Docker):

```bash
yarn dev
```

This runs the app in-place using ts-node and nodemon. The server will attempt to connect to Postgres, Redis and RabbitMQ defined in your `.env.development.local`.

3b. Containerized development (recommended for matching production-like dependencies):

```bash
yarn compose:up
```

This builds images and starts containers. Use `yarn compose:logs` to watch logs and `yarn compose:down` to stop.

3c. Build and run compiled app:

```bash
yarn build
yarn start
```

This sequence produces a `dist/` folder and runs the compiled Node app.

---

## Mailer worker

The mailer worker (in `src/workers/mailer.ts`) is dynamically imported from `src/index.ts` on startup. If configured it will connect to the `MAIL_QUEUE` (default `mail:send`) and use `RESEND_API_KEY` to send mails. Ensure `RESEND_API_KEY`, `MAIL_FROM`, and `FROM_NAME` are set if you want outbound emails to work.

---

## Tips & troubleshooting

- Missing PORT -> app may crash at startup. Set `PORT` in `.env.development.local`.
- Postgres connection fails -> verify host/port are reachable and credentials are correct. For local Docker Postgres, use the service name or `localhost` depending on networking.
- Redis connection fails -> verify `REDIS_HOST` and `REDIS_PORT`. The code calls `redis.connect()` and `redis.ping()` and will throw if unreachable.
- RabbitMQ connection -> the app supports `RABBITMQ_URL` _or_ explicit host/port fields. It will retry several times; tune `RABBITMQ_RETRY_ATTEMPTS` and `RABBITMQ_RETRY_DELAY_MS` if needed.
- Session cookie problems in dev -> the cookie `secure`, `httpOnly`, and `sameSite` flags are set to production-safe defaults only when `NODE_ENV=production`. For local development set `NODE_ENV=development`.
- If the mailer worker fails to start, check the `RESEND_API_KEY` or queue connectivity.

If something fails during startup check the logs and ensure that the services (Postgres, Redis, RabbitMQ) are running and that the `.env.development.local` file is properly loaded (the resolved path is printed on startup by `src/config/env.ts`).

---

## Developer notes

- `src/index.ts` registers `routing-controllers` controllers with `routePrefix: /api/v1`. OpenAPI JSON is available at `/openapi.json` and Swagger UI at `/docs`.
- The project uses `drizzle-orm` + `drizzle-kit` for schema/migrations. See `drizzle/` folder for migration snapshots.
- `gulp dev` uses `ts-node` directly and is the canonical fast dev workflow.

---

If you'd like, I can also add a `.env.example` file with placeholder values based on the variables listed above. Tell me whether you prefer Docker-first or local-first instructions and I'll adapt the README.
