import { getLeadById } from "@/lib/leads";
import { findUserByEmail } from "@/lib/db/auth";
import { getDisputeById, saveDisputeRecord } from "@/lib/disputes/repository";
import { env } from "@/lib/env";
import { DOMAIN_EVENT_NAMES } from "@/lib/events/eventNames";
import { emitDomainEvent } from "@/lib/events/emit";
import { applyWorkflowTransition } from "@/lib/workflows/applyTransition";
import {
  appendMailingEventRecord,
  getMailingJobByDisputeId,
  getPaymentRecordByDisputeId,
  saveMailingJob,
  savePaymentRecord,
} from "@/lib/mailing/repository";
import { DashboardPaymentStatus, upsertDashboardPayment } from "@/lib/db/dashboardPayments";
import { sendCertifiedMailToProvider } from "@/lib/mailing/sendCertifiedMail";
import { createMailingCheckout } from "@/lib/stripe/createMailingCheckout";
import {
  buildStripeIntentIds,
  resolveAppBaseUrl,
  isAuthorizationExpired,
  isPaymentAuthorized,
  isPaymentSettled,
  requiresPaymentMethodUpdate,
} from "@/lib/stripe/service";
import { bureauRecipients } from "@/lib/disputes/mailing";
import { defaultSenderAddress } from "@/lib/mailing/sender";
import {
  trackMailSentForLead,
  trackPaymentCompletedByEmail,
} from "@/lib/services/analytics";
import {
  queueMailSentNotifications,
  queuePaymentRequiredNotifications,
  queuePaymentSuccessNotifications,
} from "@/lib/services/notifications";
import type { MailingJobRecord, PaymentRecord } from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function authorizationExpiryIso() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

async function emitPaymentEvent(
  type:
    | typeof DOMAIN_EVENT_NAMES.mailingPaymentRequested
    | typeof DOMAIN_EVENT_NAMES.mailingPaymentCompleted
    | typeof DOMAIN_EVENT_NAMES.paymentFailed
    | typeof DOMAIN_EVENT_NAMES.paymentReauthorized
    | typeof DOMAIN_EVENT_NAMES.paymentCaptured,
  payment: PaymentRecord,
  actorType: "system" | "webhook",
  actorId: string,
  extraPayload?: Record<string, unknown>,
) {
  await emitDomainEvent({
    type,
    aggregateType: "payment",
    aggregateId: payment.id,
    actorType,
    actorId,
    payload: {
      disputeId: payment.disputeId,
      leadId: payment.leadId,
      amountCents: payment.amountCents,
      paymentStatus: payment.status,
      retryCount: payment.retryCount ?? 0,
      ...extraPayload,
    },
    metadata: {
      source: "mailing_payment_lifecycle",
    },
  });
}

function canRequestMailingPayment(workflowStatus: string) {
  return [
    "awaiting_admin_approval",
    "approved_pending_pdf",
    "awaiting_payment",
    "paid_ready_to_send",
  ].includes(workflowStatus);
}

async function syncDashboardPaymentSnapshot(input: {
  leadEmail?: string;
  leadId: string;
  disputeId: string;
  amountCents: number;
  currency: string;
  status: DashboardPaymentStatus;
  requestedAt: string;
  authorizedAt?: string;
  capturedAt?: string;
  serviceRenderedAt?: string;
  lastFailureReason?: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  metadata?: Record<string, unknown>;
}) {
  const user = input.leadEmail ? await findUserByEmail(input.leadEmail) : null;
  await upsertDashboardPayment({
    userId: user?.id ?? null,
    leadId: input.leadId,
    disputeId: input.disputeId,
    amountCents: input.amountCents,
    currency: input.currency,
    status: input.status,
    requestedAt: new Date(input.requestedAt),
    authorizedAt: input.authorizedAt ? new Date(input.authorizedAt) : null,
    capturedAt: input.capturedAt ? new Date(input.capturedAt) : null,
    serviceRenderedAt: input.serviceRenderedAt ? new Date(input.serviceRenderedAt) : null,
    lastFailureReason: input.lastFailureReason ?? null,
    checkoutSessionId: input.checkoutSessionId ?? null,
    paymentIntentId: input.paymentIntentId ?? null,
    metadata: input.metadata,
  });
}

export async function createMailingPaymentRequest(
  disputeId: string,
  options?: { baseUrl?: string },
) {
  const { dispute } = await getDisputeById(disputeId);
  if (!dispute) {
    throw new Error("Dispute record not found.");
  }

  if (!canRequestMailingPayment(dispute.workflowStatus) || !dispute.approvedAt || !dispute.serviceRenderedAt) {
    throw new Error("Dispute is not in a payment-requestable state.");
  }

  const requestedAt = nowIso();
  const existing = await getPaymentRecordByDisputeId(disputeId);
  const lead = getLeadById(dispute.leadId);
  if (!lead?.email) {
    throw new Error("Lead email is required before creating the Stripe checkout session.");
  }
  const baseUrl = resolveAppBaseUrl(options?.baseUrl);
  const checkout = await createMailingCheckout({
    disputeId,
    leadId: dispute.leadId,
    leadEmail: lead.email,
    amountCents: existing?.amountCents ?? 40500,
    successUrl: `${baseUrl}/dashboard?mailingPayment=${disputeId}&status=authorized`,
    cancelUrl: `${baseUrl}/dashboard?mailingPayment=${disputeId}&status=cancelled`,
  });

  const payment: PaymentRecord = {
    id: existing?.id ?? `payment_${disputeId}`,
    disputeId,
    leadId: dispute.leadId,
    amountCents: existing?.amountCents ?? 40500,
    currency: "usd",
    status: "payment_required",
    stripePaymentIntentId: checkout.paymentIntentId,
    stripeCheckoutSessionId: checkout.checkoutSessionId,
    checkoutUrl: checkout.hostedUrl,
    updatePaymentMethodUrl: checkout.updatePaymentMethodUrl,
    requestedAt: existing?.requestedAt ?? requestedAt,
    retryCount: existing ? (existing.retryCount ?? 0) + 1 : 0,
    lastRetryAt: existing ? requestedAt : undefined,
    clientActionRequired: true,
    createdAt: existing?.createdAt ?? requestedAt,
    updatedAt: requestedAt,
  };

  await savePaymentRecord(payment);
  await saveDisputeRecord({
    ...dispute,
    workflowStatus:
      dispute.workflowStatus === "approved_pending_pdf" ||
      dispute.workflowStatus === "awaiting_payment"
        ? "awaiting_payment"
        : dispute.workflowStatus,
    updatedAt: requestedAt,
  });
  await appendMailingEventRecord({
    id: `event_${disputeId}_payment_request_${requestedAt}`,
    disputeId,
    eventType: "payment_requested",
    occurredAt: requestedAt,
    actor: "system",
    notes: existing
      ? "Payment method update requested after a failed or expired authorization."
      : "Initial mailing payment request created.",
  });
  await emitPaymentEvent(
    DOMAIN_EVENT_NAMES.mailingPaymentRequested,
    payment,
    "system",
    "mailing_payment_service",
    {
      checkoutSessionId: payment.stripeCheckoutSessionId,
      paymentIntentId: payment.stripePaymentIntentId,
      checkoutUrl: payment.checkoutUrl,
    },
  );
  if (lead) {
    await syncDashboardPaymentSnapshot({
      leadEmail: lead.email,
      leadId: lead.id,
      disputeId,
      amountCents: payment.amountCents,
      currency: payment.currency,
      status: DashboardPaymentStatus.payment_required,
      requestedAt: payment.requestedAt,
      serviceRenderedAt: dispute.serviceRenderedAt ? dispute.serviceRenderedAt : requestedAt,
      checkoutSessionId: payment.stripeCheckoutSessionId,
      paymentIntentId: payment.stripePaymentIntentId,
      metadata: {
        workflowStatus: dispute.workflowStatus,
      },
    });
    await queuePaymentRequiredNotifications({
      lead,
      payment,
    });
  }

  return { payment, checkout };
}

export async function createOrRefreshPaymentMethodAuthorization(
  disputeId: string,
  actorId = "contract_signed_workflow",
) {
  const result = await createMailingPaymentRequest(disputeId);
  await emitPaymentEvent(
    DOMAIN_EVENT_NAMES.paymentReauthorized,
    result.payment,
    "system",
    actorId,
    {
      stage: "post_contract_signature",
      intent: "store_or_refresh_payment_method",
    },
  );

  return result;
}

export async function ensurePaymentMethodCollectionReady(
  disputeId: string,
  actorId = "contract_signed_workflow",
) {
  const existing = await getPaymentRecordByDisputeId(disputeId);

  if (
    existing &&
    !requiresPaymentMethodUpdate(existing) &&
    (existing.status === "authorized" ||
      existing.status === "ready_to_capture" ||
      existing.status === "captured")
  ) {
    return { payment: existing, reusedExisting: true };
  }

  const result = await createOrRefreshPaymentMethodAuthorization(disputeId, actorId);
  return { payment: result.payment, reusedExisting: false };
}

export async function ensureFinalPaymentRequestOpen(
  disputeId: string,
  _actorId = "final_pdf_gate",
) {
  const existing = await getPaymentRecordByDisputeId(disputeId);

  if (
    existing &&
    !requiresPaymentMethodUpdate(existing) &&
    (existing.status === "authorized" ||
      existing.status === "ready_to_capture" ||
      existing.status === "captured" ||
      existing.status === "payment_required")
  ) {
    return { payment: existing, reusedExisting: true };
  }

  const result = await createMailingPaymentRequest(disputeId);
  return { payment: result.payment, reusedExisting: false };
}

export async function authorizeMailingPayment(
  disputeId: string,
  actorId = "stripe_webhook",
) {
  const { dispute } = await getDisputeById(disputeId);
  const payment = await getPaymentRecordByDisputeId(disputeId);

  if (!dispute || !payment) {
    throw new Error("Dispute or payment record not found.");
  }

  if (
    payment.status === "authorized" ||
    payment.status === "ready_to_capture" ||
    payment.status === "captured"
  ) {
    return payment;
  }

  const authorizedAt = nowIso();
  const nextPayment: PaymentRecord = {
    ...payment,
    status: "authorized",
    authorizedAt,
    authorizationExpiresAt: authorizationExpiryIso(),
    clientActionRequired: false,
    updatedAt: authorizedAt,
  };

  await savePaymentRecord(nextPayment);
  await appendMailingEventRecord({
    id: `event_${disputeId}_payment_authorized_${authorizedAt}`,
    disputeId,
    eventType: "payment_confirmed",
    occurredAt: authorizedAt,
    actor: actorId,
    notes: "Payment method authorized and ready for a final capture check.",
  });
  await emitPaymentEvent(
    DOMAIN_EVENT_NAMES.paymentReauthorized,
    nextPayment,
    "webhook",
    actorId,
    {
      authorizationExpiresAt: nextPayment.authorizationExpiresAt,
    },
  );

  const lead = getLeadById(dispute.leadId);
  await syncDashboardPaymentSnapshot({
    leadEmail: lead?.email,
    leadId: dispute.leadId,
    disputeId,
    amountCents: nextPayment.amountCents,
    currency: nextPayment.currency,
    status: DashboardPaymentStatus.authorized,
    requestedAt: nextPayment.requestedAt,
    authorizedAt: nextPayment.authorizedAt,
      serviceRenderedAt: dispute.serviceRenderedAt ?? nextPayment.requestedAt,
    checkoutSessionId: nextPayment.stripeCheckoutSessionId,
    paymentIntentId: nextPayment.stripePaymentIntentId,
  });

  return nextPayment;
}

export async function markMailingPaymentFailure(
  disputeId: string,
  reason = "Payment could not be confirmed.",
  actorId = "stripe_webhook",
) {
  const { dispute } = await getDisputeById(disputeId);
  const existing = await getPaymentRecordByDisputeId(disputeId);

  if (!dispute) {
    throw new Error("Dispute record not found.");
  }

  if (existing?.status === "captured") {
    return existing;
  }

  const failedAt = nowIso();
  const ids = buildStripeIntentIds(disputeId);
  const nextPayment: PaymentRecord = {
    id: existing?.id ?? `payment_${disputeId}`,
    disputeId,
    leadId: dispute.leadId,
    amountCents: existing?.amountCents ?? 40500,
    currency: "usd",
    status: "payment_failed",
    stripePaymentIntentId: ids.paymentIntentId,
    stripeCheckoutSessionId: ids.checkoutSessionId,
    checkoutUrl:
      existing?.checkoutUrl ??
      `/dashboard?mailingPayment=${disputeId}&status=payment_required`,
    updatePaymentMethodUrl:
      existing?.updatePaymentMethodUrl ??
      `/dashboard?mailingPayment=${disputeId}&status=payment_required`,
    requestedAt: existing?.requestedAt ?? failedAt,
    failedAt,
    retryCount: (existing?.retryCount ?? 0) + 1,
    lastRetryAt: failedAt,
    lastFailureReason: reason,
    clientActionRequired: true,
    createdAt: existing?.createdAt ?? failedAt,
    updatedAt: failedAt,
  };

  await savePaymentRecord(nextPayment);
  await saveDisputeRecord({
    ...dispute,
    workflowStatus: "awaiting_payment",
    updatedAt: failedAt,
  });
  await appendMailingEventRecord({
    id: `event_${disputeId}_payment_failed_${failedAt}`,
    disputeId,
    eventType: "failed",
    occurredAt: failedAt,
    actor: actorId,
    notes: reason,
  });
  await emitPaymentEvent(
    DOMAIN_EVENT_NAMES.paymentFailed,
    nextPayment,
    "webhook",
    actorId,
    { failureReason: reason },
  );

  const lead = getLeadById(dispute.leadId);
  await syncDashboardPaymentSnapshot({
    leadEmail: lead?.email,
    leadId: dispute.leadId,
    disputeId,
    amountCents: nextPayment.amountCents,
    currency: nextPayment.currency,
    status: DashboardPaymentStatus.payment_failed,
    requestedAt: nextPayment.requestedAt,
      serviceRenderedAt: dispute.serviceRenderedAt ?? nextPayment.requestedAt,
    lastFailureReason: nextPayment.lastFailureReason,
    checkoutSessionId: nextPayment.stripeCheckoutSessionId,
    paymentIntentId: nextPayment.stripePaymentIntentId,
  });

  return nextPayment;
}

export async function captureMailingPayment(
  disputeId: string,
  actorId = "service_capture",
) {
  const { dispute } = await getDisputeById(disputeId);
  const payment = await getPaymentRecordByDisputeId(disputeId);

  if (!dispute || !payment) {
    throw new Error("Dispute or payment record not found.");
  }

  if (payment.status === "captured") {
    return payment;
  }

  if (!isPaymentAuthorized(payment)) {
    throw new Error("Payment is not authorized for capture.");
  }

  if (isAuthorizationExpired(payment)) {
    const expired = await savePaymentRecord({
      ...payment,
      status: "authorization_expired",
      clientActionRequired: true,
      lastFailureReason: "Authorization expired before capture.",
      updatedAt: nowIso(),
    });
    await emitPaymentEvent(
      DOMAIN_EVENT_NAMES.paymentFailed,
      expired,
      "system",
      actorId,
      { failureReason: expired.lastFailureReason },
    );
    const lead = getLeadById(dispute.leadId);
    await syncDashboardPaymentSnapshot({
      leadEmail: lead?.email,
      leadId: dispute.leadId,
      disputeId,
      amountCents: expired.amountCents,
      currency: expired.currency,
      status: DashboardPaymentStatus.authorization_expired,
      requestedAt: expired.requestedAt,
      authorizedAt: expired.authorizedAt,
      serviceRenderedAt: dispute.serviceRenderedAt ?? expired.requestedAt,
      lastFailureReason: expired.lastFailureReason,
      checkoutSessionId: expired.stripeCheckoutSessionId,
      paymentIntentId: expired.stripePaymentIntentId,
    });
    throw new Error("Payment authorization expired. Client must update payment method.");
  }

  const readyAt = nowIso();
  const readyPayment: PaymentRecord = {
    ...payment,
    status: "ready_to_capture",
    updatedAt: readyAt,
  };
  await savePaymentRecord(readyPayment);

  const capturedAt = nowIso();
  const capturedPayment: PaymentRecord = {
    ...readyPayment,
    status: "captured",
    capturedAt,
    confirmedAt: capturedAt,
    clientActionRequired: false,
    updatedAt: capturedAt,
  };
  const paidReadyStatus = applyWorkflowTransition({
    family: "mailing",
    fromStatus: "awaiting_payment",
    toStatus: "paid_ready_to_send",
    context: {
      hasFinalPdf: true,
      isPaymentConfirmed: true,
    },
  }).nextStatus;

  await savePaymentRecord(capturedPayment);
  await saveDisputeRecord({
    ...dispute,
    workflowStatus: paidReadyStatus,
    paidAt: capturedAt,
    readyToSendAt: capturedAt,
    updatedAt: capturedAt,
  });
  await appendMailingEventRecord({
    id: `event_${disputeId}_payment_captured_${capturedAt}`,
    disputeId,
    eventType: "payment_confirmed",
    occurredAt: capturedAt,
    actor: actorId,
    notes: "Payment captured and mailing unlocked.",
  });
  await emitPaymentEvent(
    DOMAIN_EVENT_NAMES.paymentCaptured,
    capturedPayment,
    "system",
    actorId,
    { workflowStatus: paidReadyStatus },
  );
  await emitPaymentEvent(
    DOMAIN_EVENT_NAMES.mailingPaymentCompleted,
    capturedPayment,
    "system",
    actorId,
    { workflowStatus: paidReadyStatus },
  );
  const lead = getLeadById(dispute.leadId);
  if (lead) {
    await syncDashboardPaymentSnapshot({
      leadEmail: lead.email,
      leadId: dispute.leadId,
      disputeId,
      amountCents: capturedPayment.amountCents,
      currency: capturedPayment.currency,
      status: DashboardPaymentStatus.captured,
      requestedAt: capturedPayment.requestedAt,
      authorizedAt: capturedPayment.authorizedAt,
      capturedAt,
      serviceRenderedAt: dispute.serviceRenderedAt ?? capturedPayment.requestedAt,
      checkoutSessionId: capturedPayment.stripeCheckoutSessionId,
      paymentIntentId: capturedPayment.stripePaymentIntentId,
      metadata: {
        workflowStatus: paidReadyStatus,
      },
    });
    await trackPaymentCompletedByEmail(lead.email, capturedPayment, {
      workflowStatus: paidReadyStatus,
    });
    await queuePaymentSuccessNotifications({
      lead,
      payment: capturedPayment,
    });
  }

  return capturedPayment;
}

export async function ensurePaymentCapturedForMailing(disputeId: string) {
  const payment = await getPaymentRecordByDisputeId(disputeId);

  if (!payment || requiresPaymentMethodUpdate(payment)) {
    throw new Error("Payment must be secured before mailing can continue.");
  }

  if (isPaymentSettled(payment)) {
    return payment;
  }

  return captureMailingPayment(disputeId);
}

export async function sendCertifiedMail(disputeId: string) {
  const { dispute, currentVersion } = await getDisputeById(disputeId);
  if (!dispute || !currentVersion) {
    throw new Error("Dispute record not found.");
  }

  await ensurePaymentCapturedForMailing(disputeId);

  if (
    dispute.workflowStatus !== "paid_ready_to_send" &&
    dispute.workflowStatus !== "queued_for_send" &&
    dispute.workflowStatus !== "sent_to_provider" &&
    dispute.workflowStatus !== "tracking_pending" &&
    dispute.workflowStatus !== "tracking_received"
  ) {
    throw new Error("Dispute is not ready to send to the certified mail provider.");
  }

  const existingJob = await getMailingJobByDisputeId(disputeId);
  if (
    existingJob &&
    ["submitted", "accepted", "tracking_received", "delivered"].includes(
      existingJob.providerStatus,
    )
  ) {
    return existingJob;
  }

  const queuedAt = nowIso();
  const queuedStatus = applyWorkflowTransition({
    family: "mailing",
    fromStatus: "paid_ready_to_send",
    toStatus: "queued_for_send",
    context: {
      hasFinalPdf: Boolean(currentVersion.pdfAssetPath),
      isPaymentConfirmed: true,
    },
  }).nextStatus;

  const queuedJob: MailingJobRecord = existingJob ?? {
    id: `mailjob_${disputeId}`,
    disputeId,
    leadId: dispute.leadId,
    bureau: dispute.bureau,
    workflowStatus: queuedStatus,
    providerStatus: "queued",
    deliveryStatus: "pending",
    providerName:
      env.CERTIFIED_MAIL_PROVIDER === "click2mail" ? "click2mail" : "lob",
    recipientAddress: bureauRecipients[dispute.bureau],
    senderAddress: defaultSenderAddress,
    finalPdfPath: currentVersion.pdfAssetPath,
    createdAt: queuedAt,
    updatedAt: queuedAt,
    queuedAt,
  };

  queuedJob.workflowStatus = queuedStatus;
  queuedJob.providerStatus = "queued";
  queuedJob.queuedAt = queuedAt;
  queuedJob.updatedAt = queuedAt;

  await saveMailingJob(queuedJob);
  await saveDisputeRecord({
    ...dispute,
    workflowStatus: queuedStatus,
    updatedAt: queuedAt,
  });
  await appendMailingEventRecord({
    id: `event_${disputeId}_queued_${queuedAt}`,
    disputeId,
    mailingJobId: queuedJob.id,
    eventType: "queued",
    occurredAt: queuedAt,
    actor: "system",
    notes: "Mailing job queued for provider submission.",
  });
  await emitDomainEvent({
    type: DOMAIN_EVENT_NAMES.certifiedMailQueued,
    aggregateType: "mailing_job",
    aggregateId: queuedJob.id,
    actorType: "system",
    actorId: "mailing_queue",
    payload: {
      disputeId,
      leadId: dispute.leadId,
      bureau: dispute.bureau,
      workflowStatus: queuedStatus,
    },
    metadata: {
      source: "sendCertifiedMail",
    },
  });

  const providerResponse = await sendCertifiedMailToProvider(queuedJob);
  const sentAt = nowIso();
  const sentJob: MailingJobRecord = {
    ...queuedJob,
    workflowStatus: "sent_to_provider",
    providerStatus: providerResponse.providerStatus,
    providerName: providerResponse.providerName,
    providerJobId: providerResponse.providerJobId,
    sentToProviderAt: sentAt,
    mailedAt: providerResponse.mailedAt,
    trackingNumber: providerResponse.trackingNumber,
    signedReturnReceiptStatus: providerResponse.signedReturnReceiptStatus ?? "pending",
    updatedAt: sentAt,
  };

  await saveMailingJob(sentJob);
  await saveDisputeRecord({
    ...dispute,
    workflowStatus: "tracking_pending",
    sentToProviderAt: sentAt,
    updatedAt: sentAt,
  });
  await appendMailingEventRecord({
    id: `event_${disputeId}_sent_${sentAt}`,
    disputeId,
    mailingJobId: sentJob.id,
    eventType: "sent_to_provider",
    occurredAt: sentAt,
    actor: "certified_mail_provider",
    notes: `Submitted to provider ${providerResponse.providerJobId}.`,
  });
  await emitDomainEvent({
    type: DOMAIN_EVENT_NAMES.certifiedMailSent,
    aggregateType: "mailing_job",
    aggregateId: sentJob.id,
    actorType: "provider",
    actorId: providerResponse.providerName,
    payload: {
      disputeId,
      leadId: dispute.leadId,
      providerJobId: providerResponse.providerJobId,
      trackingNumber: providerResponse.trackingNumber,
      workflowStatus: "tracking_pending",
    },
    metadata: {
      source: "sendCertifiedMail",
    },
  });
  const sentLead = getLeadById(dispute.leadId);
  if (sentLead) {
    await trackMailSentForLead(sentLead, {
      disputeId,
      provider: providerResponse.providerName,
      providerStatus: providerResponse.providerStatus,
      trackingIssued: Boolean(providerResponse.trackingNumber),
    });
    await queueMailSentNotifications({
      lead: sentLead,
      trackingNumber: providerResponse.trackingNumber,
    });
  }

  return sentJob;
}

export async function getMailingQueueRows() {
  const jobs = await (await import("@/lib/mailing/repository")).listMailingJobs();
  return jobs.map((job) => ({
    job,
    lead: getLeadById(job.leadId),
  }));
}

export async function updateTrackingStatus(input: {
  disputeId: string;
  trackingNumber: string;
  deliveryStatus?: MailingJobRecord["deliveryStatus"];
  signedReturnReceiptStatus?: MailingJobRecord["signedReturnReceiptStatus"];
  signedReturnReceiptPath?: string;
  signedReturnReceiptSigner?: string;
}) {
  const job = await getMailingJobByDisputeId(input.disputeId);
  const { dispute } = await getDisputeById(input.disputeId);
  if (!job || !dispute) {
    throw new Error("Mailing job not found.");
  }

  const updatedAt = nowIso();
  const nextJob: MailingJobRecord = {
    ...job,
    trackingNumber: input.trackingNumber,
    providerStatus: "tracking_received",
    workflowStatus: "tracking_received",
    deliveryStatus: input.deliveryStatus ?? "in_transit",
    signedReturnReceiptStatus:
      input.signedReturnReceiptStatus ??
      (input.deliveryStatus === "delivered" ? "pending" : job.signedReturnReceiptStatus),
    signedReturnReceiptPath: input.signedReturnReceiptPath ?? job.signedReturnReceiptPath,
    signedReturnReceiptSigner: input.signedReturnReceiptSigner ?? job.signedReturnReceiptSigner,
    signedReturnReceiptReceivedAt:
      input.signedReturnReceiptPath || input.signedReturnReceiptStatus === "received"
        ? updatedAt
        : job.signedReturnReceiptReceivedAt,
    updatedAt,
  };

  await saveMailingJob(nextJob);
  await saveDisputeRecord({
    ...dispute,
    workflowStatus:
      input.deliveryStatus === "delivered" ? "delivered" : "tracking_received",
    deliveredAt:
      input.deliveryStatus === "delivered" ? updatedAt : dispute.deliveredAt,
    updatedAt,
  });
  await appendMailingEventRecord({
    id: `event_${input.disputeId}_tracking_${updatedAt}`,
    disputeId: input.disputeId,
    mailingJobId: nextJob.id,
    eventType:
      input.deliveryStatus === "delivered" ? "delivered" : "tracking_received",
    occurredAt: updatedAt,
    actor: "provider_webhook",
    notes: `Tracking updated to ${input.trackingNumber}.`,
  });
  await emitDomainEvent({
    type:
      input.deliveryStatus === "delivered"
        ? DOMAIN_EVENT_NAMES.certifiedMailDelivered
        : DOMAIN_EVENT_NAMES.certifiedMailTrackingReceived,
    aggregateType: "mailing_job",
    aggregateId: nextJob.id,
    actorType: "provider",
    actorId: "provider_webhook",
    payload: {
      disputeId: input.disputeId,
      leadId: dispute.leadId,
      trackingNumber: input.trackingNumber,
      deliveryStatus: nextJob.deliveryStatus,
    },
    metadata: {
      source: "updateTrackingStatus",
    },
  });

  return nextJob;
}
