import type { MailTemplateType } from "@/lib/types";

type AdminTemplateData = {
  fullName: string;
  source?: string;
  uploadedDocuments?: string[];
  nextActionLabel?: string;
};

type AdminTemplateRenderer = {
  subject: string;
  previewText: string;
  html: string;
  text: string;
};

function wrapAdminEmail(title: string, body: string, previewText: string): AdminTemplateRenderer {
  return {
    subject: title,
    previewText,
    text: `${title}\n\n${body.replace(/<[^>]+>/g, "")}\n\nCredu Consulting Admin`,
    html: `
      <div style="background:#111113;padding:32px;font-family:Inter,Arial,sans-serif;color:#111;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:24px;overflow:hidden;">
          <div style="padding:24px 28px;background:linear-gradient(135deg,#111113 0%,#23201a 100%);color:#fff;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#c6a96b;">Admin notification</p>
            <h1 style="margin:0;font-family:Oswald,Arial,sans-serif;font-size:34px;line-height:.96;letter-spacing:.03em;text-transform:uppercase;">${title}</h1>
          </div>
          <div style="padding:24px 28px 28px;font-size:15px;line-height:1.8;color:#27272a;">
            ${body}
          </div>
        </div>
      </div>
    `,
  };
}

export function renderAdminTemplate(
  type: Extract<
    MailTemplateType,
    "new_lead_alert" | "intake_completed" | "documents_uploaded" | "ready_for_ai_review"
  >,
  data: AdminTemplateData,
): AdminTemplateRenderer {
  switch (type) {
    case "new_lead_alert":
      return wrapAdminEmail(
        "New lead entered the pipeline",
        `<p>${data.fullName} entered the system from <strong>${data.source ?? "an unknown source"}</strong>.</p>
         <p>Review the lead, confirm the handoff point, and make sure the next step stays visible.</p>`,
        "A new lead has entered the admin pipeline.",
      );
    case "intake_completed":
      return wrapAdminEmail(
        "Intake completed",
        `<p>${data.fullName} has completed the intake workflow.</p>
         <p>Review the file, confirm uploads, and decide whether the file is waiting on documents, contracts, or review.</p>`,
        "A client has completed intake and needs admin review.",
      );
    case "documents_uploaded":
      return wrapAdminEmail(
        "New documents uploaded",
        `<p>${data.fullName} uploaded new workflow items.</p>
         <ul>${(data.uploadedDocuments ?? []).map((item) => `<li>${item}</li>`).join("")}</ul>
         <p>Use the lead detail view to verify what is complete and what is still missing.</p>`,
        "A client uploaded new documents to the file.",
      );
    case "ready_for_ai_review":
      return wrapAdminEmail(
        "Lead is ready for AI review",
        `<p>${data.fullName} now has the bureau-report conditions needed for AI review.</p>
         <p>The next recommended admin action is <strong>${data.nextActionLabel ?? "run AI review"}</strong>.</p>`,
        "A lead is ready for AI review.",
      );
  }
}
