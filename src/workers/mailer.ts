// import amqp from 'amqplib';
import mjml2html from 'mjml';
import { Resend } from 'resend';
import {
  getChannel,
  // getConnection
} from '@/config/rabbitmq';
import { MailJob } from '@/dtos/mailer';

const MAIL_QUEUE = process.env.MAIL_QUEUE || 'mail:send';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn(
    'RESEND_API_KEY not set. Mailer worker will not be able to send emails.'
  );
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function startMailerWorker(): Promise<void> {
  // const conn = getConnection();
  const ch = getChannel();

  await ch.assertQueue(MAIL_QUEUE, { durable: true });

  ch.prefetch(1);

  console.log(`Mailer worker listening on queue ${MAIL_QUEUE}`);

  ch.consume(
    MAIL_QUEUE,
    async (msg) => {
      if (!msg) return;
      try {
        const job: MailJob = JSON.parse(msg.content.toString());

        // Generate HTML from MJML if provided
        let html = job.html || '';
        if (job.mjml) {
          const { html: compiled } = mjml2html(job.mjml, {
            validationLevel: 'strict',
          });
          html = compiled;
        }

        if (!resend) {
          console.log(
            'Mailer worker received job but resend client is not configured. Logging job instead:',
            job
          );
          ch.ack(msg);
          return;
        }

        const m = await resend.emails.send({
          from:
            job.from ||
            `${process.env.FROM_NAME} <${process.env.MAIL_FROM}>` ||
            'no-reply@example.com',
          to: job.to,
          subject: job.subject,
          html,
        } as any);

        if (m.error) {
          throw new Error(`Resend error: ${m.error.message}`);
        } else {
          console.log('Email sent successfully:', m.data);
        }

        ch.ack(msg);
      } catch (err) {
        console.error('Failed to process mail job:', err);
        // reject and requeue a few times could be implemented; here we nack and requeue
        try {
          ch.nack(msg, false, false); // drop the message to avoid retry storms
        } catch (e) {
          console.error('Failed to nack message', e);
        }
      }
    },
    { noAck: false }
  );
}
