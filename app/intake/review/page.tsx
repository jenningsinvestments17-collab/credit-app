import { redirect } from "next/navigation";
import { getAuthenticatedUser, requireAuthenticatedClientLead } from "@/lib/auth";
import { IntakeShell } from "@/components/client/intake/IntakeShell";
import { ReviewStep } from "@/components/client/intake/ReviewStep";
import { requireIntakeStepAccess } from "@/lib/services/intakeService";

export const dynamic = "force-dynamic";

export default async function IntakeReviewPage() {
  const session = await getAuthenticatedUser();
  const lead = await requireAuthenticatedClientLead();

  if (!session) {
    redirect("/login?next=/intake/review");
  }

  const model = await requireIntakeStepAccess({
    userId: session.user.id,
    lead,
    step: "review",
  });

  return (
    <IntakeShell model={model}>
      <ReviewStep model={model} />
    </IntakeShell>
  );
}
