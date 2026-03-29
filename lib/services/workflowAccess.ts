import { redirect } from "next/navigation";
import type { Lead } from "@/lib/types";

export function canClientAccessContracts(lead: Lead) {
  return (
    lead.intakeStatus === "completed" &&
    lead.contractPacketStatus !== "not_sent"
  );
}

export function requireContractsStage(lead: Lead) {
  if (!canClientAccessContracts(lead)) {
    const destination =
      lead.intakeStatus === "completed" ? "/dashboard" : "/intake#intake-form";
    redirect(destination);
  }
}

export function getClientBlockingStep(lead: Lead) {
  if (lead.intakeStatus !== "completed") {
    return "/intake#intake-form";
  }

  const missingDocuments = lead.documents.filter((document) => document.status === "missing");
  if (missingDocuments.length > 0) {
    return "/intake#document-upload";
  }

  return "/dashboard";
}
