import { z } from "zod";

export const intakeProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(2).max(40),
  primaryGoal: z.string().trim().min(5).max(200),
});

export const intakeDisclosureSchema = z.object({
  accuracyAcknowledged: z.literal("on"),
  disclosureAcknowledged: z.literal("on"),
});

export const intakeContractsSchema = z.object({
  contractAcknowledged: z.literal("on"),
  authorizationAcknowledged: z.literal("on"),
});

export const intakeReviewSchema = z.object({
  reviewConfirmed: z.literal("on"),
});
