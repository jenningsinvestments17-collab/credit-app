import { redirect } from "next/navigation";
import { getOrCreateIntakeForm, updateIntakeForm } from "@/lib/db/intake";
import { assertCurrentActionOrigin } from "@/lib/security/request";
import {
  intakeContractsSchema,
  intakeDisclosureSchema,
  intakeProfileSchema,
  intakeReviewSchema,
} from "@/lib/validators/intake";
import {
  buildIntakeProgressSteps,
  canAccessIntakeStep,
  deriveDocumentsReady,
  deriveReviewReady,
  getAllowedIntakeStep,
  getIntakeStepHref,
  normalizeProfileData,
} from "@/lib/workflows/intakeWorkflow";
import type { Lead } from "@/lib/types";
import type { IntakeStepId, IntakeViewModel } from "@/types/intake";

function buildBanners(searchParams?: { uploaded?: string; uploadError?: string }) {
  const banners: IntakeViewModel["banners"] = [];

  if (searchParams?.uploaded) {
    banners.push({
      id: "uploaded",
      tone: "success",
      text: `Upload received for ${searchParams.uploaded.replaceAll("_", " ")}.`,
    });
  }

  if (searchParams?.uploadError) {
    banners.push({
      id: "upload-error",
      tone: "warning",
      text: "That upload could not be processed. Please try the PDF again or contact support if the issue continues.",
    });
  }

  return banners;
}

export async function buildIntakeViewModel(input: {
  userId: string;
  lead: Lead;
  step: IntakeStepId;
  searchParams?: { uploaded?: string; uploadError?: string };
}): Promise<IntakeViewModel> {
  const intakeForm = await getOrCreateIntakeForm(input.userId);
  const profile = normalizeProfileData(
    intakeForm.profileData as Record<string, string> | undefined,
    input.lead,
  );
  const profileCompleted = Boolean(
    profile.firstName &&
      profile.lastName &&
      profile.phone &&
      profile.city &&
      profile.state &&
      profile.primaryGoal,
  );
  const disclosuresAccepted = Boolean(intakeForm.disclosuresAcceptedAt);
  const contractsAccepted = Boolean(intakeForm.contractsAcceptedAt);
  const documentsReady = deriveDocumentsReady(input.lead);
  const reviewReady = deriveReviewReady(input.lead) && documentsReady;
  const allowedStep = getAllowedIntakeStep({
    profileCompleted,
    disclosuresAccepted,
    contractsAccepted,
    documentsReady,
  });

  return {
    lead: input.lead,
    userId: input.userId,
    currentStep: intakeForm.currentStep as IntakeStepId,
    requestedStep: input.step,
    allowedStep,
    resumeHref: getIntakeStepHref(allowedStep),
    progressSteps: buildIntakeProgressSteps({
      allowedStep,
      requestedStep: input.step,
      documentsReady,
    }),
    profile,
    disclosuresAccepted,
    contractsAccepted,
    reviewReady,
    documentsReady,
    documents: input.lead.documents,
    contractDocuments: input.lead.contractDocuments,
    banners: buildBanners(input.searchParams),
    acknowledgments: [
      "No skipping. Disclosures and onboarding acknowledgments must be completed before uploads open.",
      "Required documents must be in the file before intake review can be completed.",
      "Your intake resumes from the next unlocked step each time you come back.",
    ],
    uploadGateCopy: documentsReady
      ? "The required upload gate is satisfied, so this file can move toward review."
      : "Uploads stay locked to the required document gate. All three bureau reports, valid ID, and proof of address must be in before review can be completed.",
  };
}

export async function requireIntakeStepAccess(input: {
  userId: string;
  lead: Lead;
  step: IntakeStepId;
  searchParams?: { uploaded?: string; uploadError?: string };
}) {
  const model = await buildIntakeViewModel(input);
  if (!canAccessIntakeStep(input.step, model.allowedStep)) {
    redirect(model.resumeHref);
  }
  return model;
}

export async function saveProfileStepAction(userId: string, formData: FormData) {
  "use server";
  assertCurrentActionOrigin();
  const parsed = intakeProfileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    state: formData.get("state"),
    primaryGoal: formData.get("primaryGoal"),
  });

  if (!parsed.success) {
    redirect("/intake/profile?error=1");
  }

  await updateIntakeForm(userId, {
    currentStep: "disclosures",
    profileData: parsed.data,
  });
  redirect("/intake/disclosures");
}

export async function saveDisclosuresStepAction(userId: string, formData: FormData) {
  "use server";
  assertCurrentActionOrigin();
  const parsed = intakeDisclosureSchema.safeParse({
    accuracyAcknowledged: formData.get("accuracyAcknowledged"),
    disclosureAcknowledged: formData.get("disclosureAcknowledged"),
  });

  if (!parsed.success) {
    redirect("/intake/disclosures?error=1");
  }

  await updateIntakeForm(userId, {
    currentStep: "contracts",
    disclosuresAcceptedAt: new Date(),
  });
  redirect("/intake/contracts");
}

export async function saveContractsStepAction(userId: string, formData: FormData) {
  "use server";
  assertCurrentActionOrigin();
  const parsed = intakeContractsSchema.safeParse({
    contractAcknowledged: formData.get("contractAcknowledged"),
    authorizationAcknowledged: formData.get("authorizationAcknowledged"),
  });

  if (!parsed.success) {
    redirect("/intake/contracts?error=1");
  }

  await updateIntakeForm(userId, {
    currentStep: "documents",
    contractsAcceptedAt: new Date(),
  });
  redirect("/intake/documents");
}

export async function markDocumentsStepVisited(userId: string) {
  return updateIntakeForm(userId, {
    currentStep: "documents",
  });
}

export async function completeReviewStepAction(
  userId: string,
  lead: Lead,
  formData: FormData,
) {
  "use server";
  assertCurrentActionOrigin();
  const parsed = intakeReviewSchema.safeParse({
    reviewConfirmed: formData.get("reviewConfirmed"),
  });

  if (!parsed.success) {
    redirect("/intake/review?error=1");
  }

  if (!deriveDocumentsReady(lead)) {
    redirect("/intake/documents");
  }

  await updateIntakeForm(userId, {
    currentStep: "review",
    reviewCompletedAt: new Date(),
  });
  redirect("/dashboard?resume=1");
}
