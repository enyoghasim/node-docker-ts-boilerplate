export interface MailJob {
  to: string | string[];
  subject: string;
  // mjml template string or raw HTML. Prefer MJML for templating.
  mjml?: string;
  // optional raw html fallback
  html?: string;
  // optional template variables to interpolate (if you use your own interpolation before compiling MJML)
  variables?: Record<string, unknown>;
  from?: string;
}

export type MailQueueName = string;
