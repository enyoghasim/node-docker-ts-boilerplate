import 'module-alias/register';
import 'reflect-metadata';
import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import errorHandler from './middlewares/error';
import { buildSpec } from '@/docs/openapi';
import http from 'http';

import * as swaggerUi from 'swagger-ui-express';

import routes from './routes';
import {
  useExpressServer,
  useContainer as rcUseContainer,
} from 'routing-controllers';
import { Container } from 'typedi';
import { connectRedis } from './config/redis';
import { connectDatabase } from './config/db';
import { connectRabbitMQ } from './config/rabbitmq';
import session from './config/session';
const PORT = process.env.PORT;

const app = express();

app.set('trust proxy', 1);

app.use(session);

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/', routes());

rcUseContainer(Container);

useExpressServer(app, {
  controllers: [__dirname + '/controllers/*.{js,ts}'],
  routePrefix: '/api/v1',
  defaultErrorHandler: false,
  validation: true,
  classTransformer: true,
});

// Build OpenAPI spec after controllers have been registered
const spec = buildSpec('/api/v1');

app.get('/openapi.json', (_req, res) => res.json(spec));
app.use(
  '/docs',
  swaggerUi.serve,
  // enable cookies to be sent for Try-it-out and disable submit buttons for safety
  swaggerUi.setup(spec, {
    swaggerOptions: {
      requestCredentials: 'include',
      supportedSubmitMethods: [],
    },
  })
);

app.use(errorHandler);

let server: http.Server | null = null;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await connectRedis();
    await connectRabbitMQ();
    try {
      const { startMailerWorker } = await import('./workers/mailer');
      startMailerWorker().catch((err) =>
        console.error('Mailer worker failed to start:', err)
      );
    } catch (err) {
      console.error('Failed to initialize mailer worker:', err);
    }

    server = app.listen(PORT, () => {
      const hostname = 'localhost';
      const localURL = `http://${hostname}:${PORT}`;
      const RESET = '\x1b[0m';
      const BRIGHT = '\x1b[1m';
      const FG_GREEN = '\x1b[32m';
      const FG_CYAN = '\x1b[36m';

      console.log(
        `${BRIGHT}${FG_GREEN}Server running on port ${PORT}!!!${RESET}`
      );
      console.log(`  Local:   ${FG_CYAN}${localURL}${RESET}`);
      console.log(`${BRIGHT}Press Ctrl+C to stop the server${RESET}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

const FORCE_EXIT_TIMEOUT = 10000;

function gracefulShutdown(reason: string): void {
  console.log(`Received ${reason}. Starting graceful shutdown.....`);

  const forceExit = setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, FORCE_EXIT_TIMEOUT);

  if (server) {
    server.close((err) => {
      clearTimeout(forceExit);
      if (err) {
        console.error('Error during server close:', err);
        process.exit(1);
      }
      console.log('HTTP server closed. Exiting.');
      process.exit(0);
    });
  } else {
    clearTimeout(forceExit);
    console.log('No active server to close. Exiting.');
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise rejection:', reason);
  gracefulShutdown('unhandledRejection');
});
