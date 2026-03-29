import type { ContractDocument, Lead, RequiredDocument } from "@/lib/types";

export type IntakeStepId =
  | "profile"
  | "disclosures"
  | "contracts"
  | "documents"
  | "review";

export type IntakeStepStatus = "complete" | "current" | "locked";

export type IntakeProfileData = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  state: string;
  primaryGoal: string;
};

export type IntakeProgressStep = {
  id: IntakeStepId;
  title: string;
  helper: string;
  href: string;
  status: IntakeStepStatus;
};

export type IntakeBanner = {
  id: string;
  tone: "info" | "success" | "warning";
  text: string;
};

export type IntakeViewModel = {
  lead: Lead;
  userId: string;
  currentStep: IntakeStepId;
  requestedStep: IntakeStepId;
  allowedStep: IntakeStepId;
  resumeHref: string;
  progressSteps: IntakeProgressStep[];
  profile: IntakeProfileData;
  disclosuresAccepted: boolean;
  contractsAccepted: boolean;
  reviewReady: boolean;
  documentsReady: boolean;
  documents: RequiredDocument[];
  contractDocuments: ContractDocument[];
  banners: IntakeBanner[];
  acknowledgments: string[];
  uploadGateCopy: string;
};
