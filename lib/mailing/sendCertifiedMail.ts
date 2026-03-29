import { env } from "@/lib/env";
import { sendViaClick2Mail } from "@/lib/mailing/providers/click2mail";
import { sendViaLob } from "@/lib/mailing/providers/lob";
import type { MailingJobRecord } from "@/lib/types";

export async function sendCertifiedMailToProvider(job: MailingJobRecord) {
  const provider = env.CERTIFIED_MAIL_PROVIDER;

  if (provider === "click2mail") {
    return sendViaClick2Mail(job);
  }

  return sendViaLob(job);
}
