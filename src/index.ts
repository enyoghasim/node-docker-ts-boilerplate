// Register module-alias to support TS path aliases (so imports like '@/foo' resolve to ./src/foo at runtime)
import 'module-alias/register';
import 'reflect-metadata';
import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import errorHandler from './middlewares/error';
import * as os from 'os';
import http from 'http';

import routes from './routes';
import { useExpressServer } from 'routing-controllers';
import { connectRedis } from './config/redis';
import { connectDatabase } from './config/db';
import { connectRabbitMQ } from './config/rabbitmq';

const app = express();

const PORT = process.env.PORT;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/', routes());

useExpressServer(app, {
  controllers: [__dirname + '/controllers/*.{js,ts}'],
  routePrefix: '/api/v1',
  defaultErrorHandler: false,
  validation: true,
  classTransformer: true,
});

app.use(errorHandler);

let server: http.Server | null = null;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await connectRedis();
    await connectRabbitMQ();

    server = app.listen(PORT, () => {
      const getLocalExternalIp = (): string | null => {
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
          const net = nets[name];
          if (!net) continue;
          for (const info of net) {
            if (info.family === 'IPv4' && !info.internal) {
              return info.address;
            }
          }
        }
        return null;
      };

      const hostname = 'localhost';
      const localURL = `http://${hostname}:${PORT}`;
      const networkIP = getLocalExternalIp() || '127.0.0.1';
      const networkURL = `http://${networkIP}:${PORT}`;

      const RESET = '\x1b[0m';
      const BRIGHT = '\x1b[1m';
      const FG_GREEN = '\x1b[32m';
      const FG_CYAN = '\x1b[36m';
      const FG_YELLOW = '\x1b[33m';

      console.log(
        `${BRIGHT}${FG_GREEN}Server running on port ${PORT}!!!${RESET}`
      );
      console.log(`  Local:   ${FG_CYAN}${localURL}${RESET}`);
      console.log(`  Network: ${FG_YELLOW}${networkURL}${RESET}`);
      console.log(`${BRIGHT}Press Ctrl+C to stop the server${RESET}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdownn
const FORCE_EXIT_TIMEOUT = 10000; // ms

function gracefulShutdown(reason: string): void {
  console.log(`Received ${reason}. Starting graceful shutdown.....`);

  // Force exit if shutdown takes too long
  const forceExit = setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, FORCE_EXIT_TIMEOUT);

  // Close HTTP server (stop accepting new connections)
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
