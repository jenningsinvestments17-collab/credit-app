import type {
  NotificationAudience,
  NotificationChannel,
  NotificationTemplateType,
} from "@/lib/types";
import { buildPaymentTermsDisclaimer } from "@/lib/compliance/disclaimers";
import { applyContentGuardrails } from "@/lib/compliance/guardrails";

type NotificationRenderResult = {
  audience: NotificationAudience;
  channel: NotificationChannel;
  subject: string;
  previewText: string;
  text: string;
  html?: string;
};

function wrapEmail(subject: string, body: string, previewText: string): NotificationRenderResult {
  const safeSubject = applyContentGuardrails(subject);
  const safeBody = applyContentGuardrails(body);
  const safePreview = applyContentGuardrails(previewText);
  return {
    audience: "client",
    channel: "email",
    subject: safeSubject,
    previewText: safePreview,
    text: `${safeSubject}\n\n${safeBody.replace(/<[^>]+>/g, "")}\n\nCredu Consulting`,
    html: `
      <div style="background:#0b0b0c;padding:32px;font-family:Inter,Arial,sans-serif;color:#111;">
        <div style="max-width:640px;margin:0 auto;background:#f5f5f4;border:1px solid rgba(0,0,0,0.08);border-radius:24px;overflow:hidden;">
          <div style="padding:28px 28px 12px;background:linear-gradient(135deg,#111113 0%,#1a1712 100%);color:#fff;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#c6a96b;">Credu Consulting</p>
            <h1 style="margin:0;font-family:Oswald,Arial,sans-serif;font-size:34px;line-height:.96;letter-spacing:.03em;text-transform:uppercase;">${safeSubject}</h1>
          </div>
          <div style="padding:24px 28px 28px;font-size:15px;line-height:1.8;color:#27272a;">${safeBody}<p style="margin-top:18px;color:#52525b;font-size:13px;line-height:1.7;">${buildPaymentTermsDisclaimer()}</p></div>
        </div>
      </div>
    `,
  };
}

function wrapAdminEmail(subject: string, body: string, previewText: string): NotificationRenderResult {
  const safeSubject = applyContentGuardrails(subject);
  const safeBody = applyContentGuardrails(body);
  const safePreview = applyContentGuardrails(previewText);
  return {
    audience: "admin",
    channel: "email",
    subject: safeSubject,
    previewText: safePreview,
    text: `${safeSubject}\n\n${safeBody.replace(/<[^>]+>/g, "")}\n\nCredu Admin`,
    html: `
      <div style="background:#111113;padding:32px;font-family:Inter,Arial,sans-serif;color:#111;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:24px;overflow:hidden;">
          <div style="padding:24px 28px;background:linear-gradient(135deg,#111113 0%,#23201a 100%);color:#fff;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#c6a96b;">Admin alert</p>
            <h1 style="margin:0;font-family:Oswald,Arial,sans-serif;font-size:32px;line-height:.96;letter-spacing:.03em;text-transform:uppercase;">${safeSubject}</h1>
          </div>
          <div style="padding:24px 28px 28px;font-size:15px;line-height:1.8;color:#27272a;">${safeBody}</div>
        </div>
      </div>
    `,
  };
}

function wrapSms(text: string, audience: NotificationAudience): NotificationRenderResult {
  return {
    audience,
    channel: "sms",
    subject: "",
    previewText: applyContentGuardrails(text),
    text: applyContentGuardrails(text),
  };
}

export function renderNotificationTemplate(
  template: NotificationTemplateType,
  payload: Record<string, unknown>,
  channel: NotificationChannel,
): NotificationRenderResult {
  const supportEmail = "support@creduconsulting.com";
  const adminAddress = "admin dashboard";
  const nextStep = typeof payload.nextStep === "string" ? payload.nextStep : "return to your portal";

  switch (template) {
    case "account_created":
      return channel === "sms"
        ? wrapSms(
            "Your account is set up. Start intake in the client portal when you are ready. No upfront service fee.",
            "client",
          )
        : wrapEmail(
            "Your account is ready",
            `<p>Your client portal is ready.</p>
             <p>Start intake when you are ready. The platform will keep the next step visible and the service fee stays out of the way until the work reaches final release.</p>
             <p>If you need help, contact ${supportEmail}.</p>`,
            "Your account is ready and intake can begin.",
          );
    case "intake_incomplete":
      return channel === "sms"
        ? wrapSms(
            "Your intake is still open. Return to the client portal to keep your file moving.",
            "client",
          )
        : wrapEmail(
            "Your intake is still open",
            `<p>Your intake has started but is not finished yet.</p>
             <p>Return to the client portal to keep your file moving. Your next step is to ${nextStep.toLowerCase()}.</p>
             <p>If you need support, contact ${supportEmail}.</p>`,
            "Your intake is still open and ready for your next step.",
          );
    case "documents_missing":
      return channel === "sms"
        ? wrapSms(
            "Required documents are still missing from your file. Return to the portal to upload the remaining items.",
            "client",
          )
        : wrapEmail(
            "Required documents are still missing",
            `<p>Your file still needs required items before review can move forward.</p>
             <p>Return to the portal to upload the remaining documents and reports. The workflow stays locked until the required file is complete.</p>
             <p>If you need help, contact ${supportEmail}.</p>`,
            "Required documents are still missing from your file.",
          );
    case "ai_draft_ready":
      return channel === "sms"
        ? wrapSms(
            "Your file has moved into the next review stage. Check the portal for status updates.",
            "client",
          )
        : wrapEmail(
            "Your file moved into review",
            `<p>Your file has progressed into the draft review stage.</p>
             <p>The portal will show the current status, the next action, and when the file moves closer to final approval.</p>`,
            "Your file has moved into the next review stage.",
          );
    case "payment_required":
      return channel === "sms"
        ? wrapSms(
            "Your dispute is ready for final release. Update or confirm your payment method in the client portal.",
            "client",
          )
        : wrapEmail(
            "Payment is required for final release",
            `<p>Your dispute work is ready for the final release stage.</p>
             <p>There is still no upfront service fee. Payment is only required now because the file is ready to move into final certified mailing.</p>
             <p>Return to the portal to confirm or update your payment method.</p>`,
            "Payment is now required for the final release stage.",
          );
    case "payment_success":
      return channel === "sms"
        ? wrapSms(
            "Payment secured. Your file can now move into the final mailing stage.",
            "client",
          )
        : wrapEmail(
            "Payment secured",
            `<p>Your payment method is secured.</p>
             <p>Your file can now move into the next release stage without payment-related blockers.</p>`,
            "Your payment method is secured.",
          );
    case "mail_sent":
      return channel === "sms"
        ? wrapSms(
            "Your dispute has been sent through certified mail. Check the portal for tracking updates.",
            "client",
          )
        : wrapEmail(
            "Certified mail is in motion",
            `<p>Your final dispute has moved into certified mail.</p>
             <p>The portal will show tracking and mailing updates as the provider moves the file forward.</p>`,
            "Your dispute has been sent through certified mail.",
          );
    case "admin_follow_up":
      return channel === "sms"
        ? wrapSms(
            "Your credit repair file needs your attention. Check your portal for the next required step.",
            "client",
          )
        : wrapEmail(
            "Your file needs attention",
            `<p>Your file needs a quick follow-up to keep moving.</p>
             <p>Please return to your portal and complete the next required step. If you need help, contact ${supportEmail}.</p>`,
            "Your file needs a quick follow-up.",
          );
    case "admin_account_created":
      return wrapAdminEmail(
        "New account created",
        `<p>A new client account has been created.</p>
         <p>Review the ${adminAddress} to confirm the file moves cleanly into intake.</p>`,
        "A new client account was created.",
      );
    case "admin_documents_uploaded":
      return wrapAdminEmail(
        "Documents uploaded",
        `<p>A client uploaded new workflow documents.</p>
         <p>Open the ${adminAddress} to check whether the file is still waiting on reports, ready for AI, or needs manual review.</p>`,
        "A client uploaded new workflow documents.",
      );
    case "admin_ai_draft_ready":
      return wrapAdminEmail(
        "AI draft ready",
        `<p>A file has moved into the draft review stage.</p>
         <p>Open the ${adminAddress} to review the draft, edit it if needed, and decide whether it should be approved.</p>`,
        "A dispute draft is ready for admin review.",
      );
    case "admin_payment_required":
      return wrapAdminEmail(
        "Payment required before release",
        `<p>A case is ready for final release but still needs the payment gate resolved.</p>
         <p>Open the ${adminAddress} to confirm whether the client must update their payment method.</p>`,
        "A case needs payment resolution before final release.",
      );
    case "admin_payment_success":
      return wrapAdminEmail(
        "Payment secured",
        `<p>The post-service payment gate has been cleared.</p>
         <p>The case can now move toward the final certified-mail release if the remaining workflow gates are satisfied.</p>`,
        "A case cleared the payment gate.",
      );
    case "admin_mail_sent":
      return wrapAdminEmail(
        "Certified mail sent",
        `<p>A dispute has moved into certified mail.</p>
         <p>Open the ${adminAddress} to monitor provider status, tracking, and return-receipt updates.</p>`,
        "A dispute has been sent through certified mail.",
      );
  }
}
