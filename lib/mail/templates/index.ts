import type { MailAudience, MailTemplateType } from "@/lib/types";
import { renderAdminTemplate } from "@/lib/mail/templates/admin";
import { renderClientTemplate } from "@/lib/mail/templates/client";

export type MailTemplateRenderResult = {
  audience: MailAudience;
  subject: string;
  previewText: string;
  html: string;
  text: string;
};

type SharedData = Record<string, unknown>;

export const mailTemplateMeta: Record<
  MailTemplateType,
  { label: string; audience: MailAudience }
> = {
  booking_confirmation: { label: "Booking confirmation", audience: "client" },
  intake_reminder: { label: "Intake reminder", audience: "client" },
  missing_documents: { label: "Missing documents", audience: "client" },
  next_step_guidance: { label: "Next step guidance", audience: "client" },
  contracts_sent: { label: "Contracts sent", audience: "client" },
  contracts_signed: { label: "Contracts signed", audience: "client" },
  new_lead_alert: { label: "New lead alert", audience: "admin" },
  intake_completed: { label: "Intake completed", audience: "admin" },
  documents_uploaded: { label: "Documents uploaded", audience: "admin" },
  ready_for_ai_review: { label: "Ready for AI review", audience: "admin" },
};

export function renderMailTemplate(
  type: MailTemplateType,
  data: SharedData,
): MailTemplateRenderResult {
  const meta = mailTemplateMeta[type];

  if (meta.audience === "client") {
    return {
      audience: "client",
      ...renderClientTemplate(type as never, data as never),
    };
  }

  return {
    audience: "admin",
    ...renderAdminTemplate(type as never, data as never),
  };
}
