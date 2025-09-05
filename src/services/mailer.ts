import { Service } from 'typedi';
import { getChannel } from '@/config/rabbitmq';
import { MailJob } from '@/dtos/mailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';

const MAIL_QUEUE = process.env.MAIL_QUEUE || 'mail:send';
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates', 'mail');

@Service()
export class MailerService {
  async enqueue(job: MailJob): Promise<void> {
    const ch = getChannel();
    await ch.assertQueue(MAIL_QUEUE, { durable: true });
    const payload = Buffer.from(JSON.stringify(job));
    ch.sendToQueue(MAIL_QUEUE, payload, { persistent: true });
  }

  async sendEmail(
    subject: string,
    to: string | string[],
    template: string,
    variables?: Record<string, unknown>,
    from?: string
  ): Promise<void> {
    await this.sendTemplatedEmail({
      template,
      variables,
      recipients: to,
      subject: subject,
      from,
    });
  }

  async sendTemplatedEmail(opts: {
    template: string;
    variables?: Record<string, unknown>;
    recipients: string | string[];
    subject?: string;
    from?: string;
  }): Promise<void> {
    const { template, variables, recipients, subject, from } = opts;
    const tplPath = path.join(TEMPLATES_DIR, `${template}.mjml`);
    if (!fs.existsSync(tplPath)) {
      throw new Error(`Template not found: ${template} (looked at ${tplPath})`);
    }

    const fragment = fs.readFileSync(tplPath, { encoding: 'utf8' });

    const fragmentTpl = Handlebars.compile(fragment);
    const compiledFragment = fragmentTpl(variables || {});

    const layoutPath = path.join(TEMPLATES_DIR, 'layout', 'layout.mjml');
    let mjmlTemplate = compiledFragment;
    if (fs.existsSync(layoutPath)) {
      const layout = fs.readFileSync(layoutPath, { encoding: 'utf8' });
      const layoutTpl = Handlebars.compile(layout);
      mjmlTemplate = layoutTpl({
        body: compiledFragment,
        ...(variables || {}),
        appName: process.env.APP_NAME || 'MyApp',
      });
    }

    const { html } = mjml2html(mjmlTemplate, { validationLevel: 'soft' });

    const job: MailJob = {
      to: recipients,
      subject:
        subject || (variables && (variables as any).subject) || 'No subject',
      html,
      variables,
      from,
    };

    await this.enqueue(job);
  }
}

export function getMailQueueName(): string {
  return MAIL_QUEUE;
}
