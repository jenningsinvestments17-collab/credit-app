import type { MailTemplateType } from "@/lib/types";

type ClientTemplateData = {
  fullName: string;
  supportEmail?: string;
  missingItems?: string[];
  nextActionLabel?: string;
  documentCount?: number;
};

type ClientTemplateRenderer = {
  subject: string;
  previewText: string;
  html: string;
  text: string;
};

function wrapClientEmail(title: string, body: string, previewText: string): ClientTemplateRenderer {
  return {
    subject: title,
    previewText,
    text: `${title}\n\n${body.replace(/<[^>]+>/g, "")}\n\nCredu Consulting`,
    html: `
      <div style="background:#0b0b0c;padding:32px;font-family:Inter,Arial,sans-serif;color:#111;">
        <div style="max-width:640px;margin:0 auto;background:#f5f5f4;border:1px solid rgba(0,0,0,0.08);border-radius:24px;overflow:hidden;">
          <div style="padding:28px 28px 12px;background:linear-gradient(135deg,#111113 0%,#1a1712 100%);color:#fff;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#c6a96b;">Credu Consulting</p>
            <h1 style="margin:0;font-family:Oswald,Arial,sans-serif;font-size:36px;line-height:.96;letter-spacing:.03em;text-transform:uppercase;">${title}</h1>
          </div>
          <div style="padding:24px 28px 28px;font-size:15px;line-height:1.8;color:#27272a;">
            ${body}
          </div>
        </div>
      </div>
    `,
  };
}

export function renderClientTemplate(
  type: Extract<
    MailTemplateType,
    | "booking_confirmation"
    | "intake_reminder"
    | "missing_documents"
    | "next_step_guidance"
    | "contracts_sent"
    | "contracts_signed"
  >,
  data: ClientTemplateData,
): ClientTemplateRenderer {
  const supportEmail = data.supportEmail ?? "support@creduconsulting.com";

  switch (type) {
    case "booking_confirmation":
      return wrapClientEmail(
        "Consultation booked",
        `<p>${data.fullName}, your consultation is on the board. We will use the call to frame the pressure points, explain the workflow, and make the next move easier to understand.</p>
         <p>Before the call, have your biggest credit goal in mind and bring any reports you already have. After booking, the next step is your guided intake.</p>
         <p>If you need help before then, reply here or contact ${supportEmail}.</p>`,
        "Your consultation is booked and your next step is ready.",
      );
    case "intake_reminder":
      return wrapClientEmail(
        "Pick back up where you left off",
        `<p>${data.fullName}, your intake is still open and your next step is waiting.</p>
         <p>Return to the portal to keep your file moving. The next recommended action is <strong>${data.nextActionLabel ?? "continue intake"}</strong>.</p>
         <p>If you need support gathering documents or reports, contact ${supportEmail}.</p>`,
        "Your intake is still in progress.",
      );
    case "missing_documents":
      return wrapClientEmail(
        "Documents still needed",
        `<p>${data.fullName}, your file still needs a few items before review can move forward.</p>
         <p>Still missing:</p>
         <ul>${(data.missingItems ?? []).map((item) => `<li>${item}</li>`).join("")}</ul>
         <p>Upload these inside your portal so the review stays organized and on track.</p>`,
        "A few required documents are still missing from your file.",
      );
    case "next_step_guidance":
      return wrapClientEmail(
        "Your next step is clear",
        `<p>${data.fullName}, your file has moved forward and your next action is now <strong>${data.nextActionLabel ?? "continue in the client portal"}</strong>.</p>
         <p>Keep moving through the portal so your status, uploads, and onboarding stay aligned.</p>`,
        "Your file has progressed and the next step is ready.",
      );
    case "contracts_sent":
      return wrapClientEmail(
        "Contracts are ready for review",
        `<p>${data.fullName}, your onboarding packet is now available in the client portal.</p>
         <p>You have <strong>${data.documentCount ?? 0}</strong> documents waiting for review and signature. Read through each one carefully, then sign where required to keep onboarding moving.</p>`,
        "Your onboarding contracts are ready to review and sign.",
      );
    case "contracts_signed":
      return wrapClientEmail(
        "Contract packet completed",
        `<p>${data.fullName}, your signature packet is complete.</p>
         <p>Your onboarding is moving forward, and the next internal step can now continue without signature-related blockers.</p>`,
        "Your contract packet is fully signed.",
      );
  }
}
