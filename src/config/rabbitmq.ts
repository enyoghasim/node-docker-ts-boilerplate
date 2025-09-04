import amqp from 'amqplib';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  // if already connected, reuse
  if (connection) {
    return;
  }
  const urlFromEnv = process.env.RABBITMQ_URL;
  let url: string | undefined = urlFromEnv;

  if (!url) {
    const host = process.env.RABBITMQ_HOST;
    const port = process.env.RABBITMQ_PORT;
    const user = process.env.RABBITMQ_USER;
    const password = process.env.RABBITMQ_PASSWORD;

    if (!host || !port) {
      const err = new Error(
        'RABBITMQ_URL or RABBITMQ_HOST and RABBITMQ_PORT must be set in environment'
      );
      console.error(err.message);
      throw err;
    }

    // build a URL like amqp://user:pass@host:port
    const auth = user
      ? `${encodeURIComponent(user)}${password ? `:${encodeURIComponent(password)}` : ''}@`
      : '';
    url = `amqp://${auth}${host}:${port}`;
  }

  // Retry with exponential backoff. Useful when Docker starts app before rabbitmq is ready.
  const maxAttempts = process.env.RABBITMQ_RETRY_ATTEMPTS
    ? parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS)
    : 10;
  const baseDelayMs = process.env.RABBITMQ_RETRY_DELAY_MS
    ? parseInt(process.env.RABBITMQ_RETRY_DELAY_MS)
    : 1000;

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      try {
        const info = new URL(url);
        const displayHost = info.hostname;
        const displayPort =
          info.port || (info.protocol === 'amqps:' ? '5671' : '5672');
        console.log(
          `Connecting to RabbitMQ at ${displayHost}:${displayPort} (attempt ${attempt})`
        );
      } catch (e) {
        console.log(`Connecting to RabbitMQ (attempt ${attempt})`);
      }

      const conn = (await (amqp as any).connect(url)) as amqp.Connection;
      const ch = (await (conn as any).createChannel()) as amqp.Channel;

      connection = conn;
      channel = ch;

      // basic event logging
      conn.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
      });
      conn.on('close', () => {
        console.warn('RabbitMQ connection closed');
        connection = null;
        channel = null;
      });

      console.log('RabbitMQ connected successfully');
      return;
    } catch (error) {
      lastError = error;
      const errMsg =
        error && (error as any).message
          ? (error as any).message
          : String(error);
      console.warn(`RabbitMQ connection attempt ${attempt} failed: ${errMsg}`);
      // if last attempt, break and rethrow below
      if (attempt === maxAttempts) break;

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), 10000);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  // exhausted attempts
  connection = null;
  channel = null;
  console.error('RabbitMQ connection failed after retries:', lastError);
  throw lastError;
}

export function getChannel(): amqp.Channel {
  if (!channel) {
    throw new Error(
      'RabbitMQ channel is not initialized. Call connectRabbitMQ() first.'
    );
  }
  return channel;
}

export function getConnection(): amqp.Connection {
  if (!connection) {
    throw new Error(
      'RabbitMQ connection is not initialized. Call connectRabbitMQ() first.'
    );
  }
  return connection;
}
