import { renderMailTemplate } from "@/lib/mail/templates";
import type { MailJob, MailTemplateType } from "@/lib/types";

export type SendEmailInput = {
  to: string;
  type: MailTemplateType;
  data: Record<string, unknown>;
  leadId?: string;
};

export type MailProviderAdapter = {
  send: (payload: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<{ provider: string; messageId: string }>;
};

const placeholderProvider: MailProviderAdapter = {
  async send() {
    return {
      provider: "placeholder-provider",
      messageId: `msg_${Date.now()}`,
    };
  },
};

export function getMailProvider() {
  // Future integration point for Resend / SendGrid / SES.
  // Swap this provider selection once environment-based mail delivery is wired.
  return placeholderProvider;
}

export async function sendEmail(input: SendEmailInput) {
  const rendered = renderMailTemplate(input.type, input.data);
  const provider = getMailProvider();
  const response = await provider.send({
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  return {
    ...response,
    previewText: rendered.previewText,
    audience: rendered.audience,
  };
}

export async function deliverQueuedMailJob(job: MailJob, data: Record<string, unknown>) {
  return sendEmail({
    to: job.to,
    type: job.type,
    data,
    leadId: job.leadId,
  });
}
