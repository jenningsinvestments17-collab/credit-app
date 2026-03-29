import type {
  ContractDocument,
  ContractDocumentKey,
  ContractPacketStatus,
} from "@/lib/types";

const contractDocumentBase: Record<
  ContractDocumentKey,
  { label: string; description: string; required: boolean; version: string }
> = {
  service_agreement: {
    label: "Service agreement / contract",
    description: "Primary onboarding agreement covering service terms and client relationship.",
    required: true,
    version: "v1",
  },
  consumer_rights_disclosure: {
    label: "Consumer rights disclosure",
    description: "Consumer disclosure included in the onboarding packet for review and acknowledgment.",
    required: true,
    version: "v1",
  },
  cancellation_form: {
    label: "Cancellation form",
    description: "Cancellation notice and timing disclosure included with the onboarding packet.",
    required: true,
    version: "v1",
  },
  authorization_release_information: {
    label: "Authorization to release information",
    description: "Authorization allowing the onboarding process to move with the necessary supporting information.",
    required: true,
    version: "v1",
  },
  authorization_submit_disputes: {
    label: "Authorization to submit disputes and regulatory complaints",
    description: "Client-directed authorization covering dispute and complaint workflow when appropriate.",
    required: true,
    version: "v1",
  },
  consumer_directed_dispute_authorization: {
    label: "Consumer directed dispute authorization",
    description: "Acknowledgment of consumer-directed dispute activity as part of the packet.",
    required: true,
    version: "v1",
  },
  consumer_file_request_form: {
    label: "Consumer file request form",
    description: "Supporting request form included in the onboarding paperwork packet.",
    required: true,
    version: "v1",
  },
};

export const contractPacketMeta: Record<
  ContractPacketStatus,
  { label: string; tone: string; description: string }
> = {
  not_sent: {
    label: "Not Sent",
    tone: "bg-zinc-900 text-zinc-200 border-white/10",
    description: "The onboarding packet has not been sent to the client yet.",
  },
  sent: {
    label: "Sent",
    tone: "bg-accent/10 text-[#7d6434] border-accent/25",
    description: "The onboarding packet is assigned and available for client review.",
  },
  awaiting_signature: {
    label: "Awaiting Signature",
    tone: "bg-amber-500/12 text-amber-200 border-amber-400/20",
    description: "The client has documents to review and sign before onboarding can advance.",
  },
  partially_signed: {
    label: "Partially Signed",
    tone: "bg-indigo-500/12 text-indigo-200 border-indigo-400/20",
    description: "Some onboarding documents are signed, but the packet is not complete yet.",
  },
  signed: {
    label: "Signed",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "All required onboarding documents have been signed.",
  },
  completed: {
    label: "Completed",
    tone: "bg-sky-500/12 text-sky-200 border-sky-400/20",
    description: "The packet is complete and the client can move into the next onboarding stage.",
  },
};

export function buildContractDocuments(
  statuses: Partial<Record<ContractDocumentKey, ContractDocument["status"]>>,
  timestamps?: Partial<
    Record<ContractDocumentKey, { sentAt?: string; signedAt?: string }>
  >,
): ContractDocument[] {
  return Object.entries(contractDocumentBase).map(([key, value]) => ({
    key: key as ContractDocumentKey,
    label: value.label,
    description: value.description,
    required: value.required,
    version: value.version,
    status: statuses[key as ContractDocumentKey] ?? "not_sent",
    sentAt: timestamps?.[key as ContractDocumentKey]?.sentAt,
    signedAt: timestamps?.[key as ContractDocumentKey]?.signedAt,
  }));
}

export function getContractCounts(documents: ContractDocument[]) {
  const totalRequired = documents.filter((doc) => doc.required).length;
  const sent = documents.filter((doc) => doc.status !== "not_sent").length;
  const signed = documents.filter(
    (doc) => doc.status === "signed" || doc.status === "completed",
  ).length;
  const awaiting = documents.filter((doc) => doc.status === "awaiting_signature").length;

  return {
    totalRequired,
    sent,
    signed,
    awaiting,
    missingSignatures: totalRequired - signed,
  };
}

export function isContractPacketFullySigned(documents: ContractDocument[]) {
  return documents
    .filter((doc) => doc.required)
    .every((doc) => doc.status === "signed" || doc.status === "completed");
}

export function getNextUnsignedContract(documents: ContractDocument[]) {
  return documents.find(
    (doc) => doc.required && doc.status !== "signed" && doc.status !== "completed",
  ) ?? null;
}

export function renderContractTemplatePreview(document: ContractDocument, clientName: string) {
  return `Document: ${document.label}
Version: ${document.version}
Client: ${clientName}

This is a placeholder rendering surface for the future contract template system.
It will later support stored templates, client merge fields, admin review, PDF export,
and signature audit events without changing the portal or admin workflow layout.`;
}
