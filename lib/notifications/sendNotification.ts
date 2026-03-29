import { env } from "@/lib/env";
import { incrementOpsCounter, recordDurationMetric } from "@/lib/monitoring/ops";
import { renderNotificationTemplate } from "@/lib/notifications/templates";
import type { NotificationChannel, NotificationJob, NotificationTemplateType } from "@/lib/types";

type EmailAdapter = {
  send: (payload: { to: string; subject: string; html?: string; text: string }) => Promise<{
    provider: string;
    messageId: string;
  }>;
};

type SmsAdapter = {
  send: (payload: { to: string; text: string }) => Promise<{
    provider: string;
    messageId: string;
  }>;
};

const placeholderEmailAdapter: EmailAdapter = {
  async send() {
    return {
      provider: env.NOTIFICATION_EMAIL_PROVIDER,
      messageId: `email_${Date.now()}`,
    };
  },
};

const placeholderSmsAdapter: SmsAdapter = {
  async send() {
    return {
      provider: "placeholder-sms",
      messageId: `sms_${Date.now()}`,
    };
  },
};

export function getEmailAdapter() {
  return placeholderEmailAdapter;
}

export function getSmsAdapter() {
  return placeholderSmsAdapter;
}

export async function sendNotification(input: {
  to: string;
  template: NotificationTemplateType;
  channel: NotificationChannel;
  payload: Record<string, unknown>;
}) {
  const startedAt = Date.now();
  const rendered = renderNotificationTemplate(input.template, input.payload, input.channel);

  if (input.channel === "sms") {
    if (!env.NOTIFICATION_SMS_ENABLED) {
      throw new Error("SMS notifications are disabled.");
    }

    const response = await getSmsAdapter().send({
      to: input.to,
      text: rendered.text,
    });

    const result = {
      ...response,
      previewText: rendered.previewText,
    };
    await incrementOpsCounter("notification.sms_attempt");
    await recordDurationMetric("notification.sms_send_ms", Date.now() - startedAt);
    return result;
  }

  const response = await getEmailAdapter().send({
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  const result = {
    ...response,
    previewText: rendered.previewText,
  };
  await incrementOpsCounter("notification.email_attempt");
  await recordDurationMetric("notification.email_send_ms", Date.now() - startedAt);
  return result;
}

export async function deliverNotificationJob(job: NotificationJob) {
  return sendNotification({
    to: job.to,
    template: job.template,
    channel: job.channel,
    payload: job.payload,
  });
}
