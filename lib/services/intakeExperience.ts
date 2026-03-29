import { getDocumentCounts } from "@/lib/leads";
import type { IntakeWorkflowProgress, Lead, RequiredDocument } from "@/lib/types";

export type IntakeLockStep = {
  id: string;
  number: string;
  title: string;
  copy: string;
  status: "complete" | "active" | "locked";
};

export type IntakeDisclosureItem = {
  id: string;
  label: string;
  copy: string;
  status: "ready" | "pending";
};

export type IntakeExperienceModel = {
  steps: IntakeLockStep[];
  disclosures: IntakeDisclosureItem[];
  uploadGateCopy: string;
  uploadSummary: {
    uploaded: number;
    total: number;
    missing: number;
    readyForAi: boolean;
  };
};

export function buildIntakeExperience(
  lead: Lead | undefined,
  intakeProgress: IntakeWorkflowProgress,
  documents: RequiredDocument[],
): IntakeExperienceModel {
  const counts = getDocumentCounts(documents);
  const allBureausReady =
    documents
      .filter((document) => document.key.endsWith("_report"))
      .every((document) => document.status !== "missing") &&
    documents.filter((document) => document.key.endsWith("_report")).length === 3;
  const readyForAi = allBureausReady && counts.missing === 0;

  const steps: IntakeLockStep[] = [
    {
      id: "basic",
      number: "01",
      title: "Identity and contact",
      copy: "Start the file with the client information needed to keep the case anchored correctly.",
      status:
        intakeProgress.currentStepNumber > 1
          ? "complete"
          : intakeProgress.currentStepNumber === 1
            ? "active"
            : "locked",
    },
    {
      id: "goals",
      number: "02",
      title: "Goals and situation",
      copy: "Frame what credit is blocking right now so the file stays connected to the client’s real outcome.",
      status:
        intakeProgress.currentStepNumber > 2
          ? "complete"
          : intakeProgress.currentStepNumber === 2
            ? "active"
            : "locked",
    },
    {
      id: "reports",
      number: "03",
      title: "Report readiness",
      copy: "Confirm whether all three bureau reports are ready so the workflow knows what still needs to be collected.",
      status:
        intakeProgress.currentStepNumber > 3
          ? "complete"
          : intakeProgress.currentStepNumber === 3
            ? "active"
            : "locked",
    },
    {
      id: "uploads",
      number: "04",
      title: "Secure upload center",
      copy: "Upload bureau reports, ID, and proof of address. AI review stays locked until every required item is in.",
      status:
        intakeProgress.currentStepNumber > 4
          ? "complete"
          : intakeProgress.currentStepNumber === 4
            ? "active"
            : "locked",
    },
    {
      id: "review",
      number: "05",
      title: "Review and continue",
      copy: "Confirm the file is organized, then move forward into contracts, review, and the next operational stage.",
      status: intakeProgress.currentStepNumber === 5 ? "active" : "locked",
    },
  ];

  return {
    steps,
    disclosures: [
      {
        id: "accuracy",
        label: "Accuracy acknowledgment",
        copy: "Client confirms the intake information and uploaded documents reflect the current file accurately.",
        status: lead ? "ready" : "pending",
      },
      {
        id: "document-gate",
        label: "Required upload gate",
        copy: "AI review stays blocked until all three bureau reports, valid ID, and proof of address are in the file.",
        status: counts.uploaded > 0 ? "ready" : "pending",
      },
      {
        id: "signature-gate",
        label: "Disclosure and signature gate",
        copy: "Required disclosures and e-sign packet open after the intake is organized so onboarding stays compliant and sequential.",
        status: lead?.contractPacketStatus && lead.contractPacketStatus !== "not_sent" ? "ready" : "pending",
      },
    ],
    uploadGateCopy: readyForAi
      ? "The required upload gate is satisfied, so this file can move toward AI review once admin confirms readiness."
      : "No skipping here. AI generation stays locked until all three bureau reports, valid ID, and proof of address are uploaded.",
    uploadSummary: {
      uploaded: counts.uploaded,
      total: counts.total,
      missing: counts.missing,
      readyForAi,
    },
  };
}
