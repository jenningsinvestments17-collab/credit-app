import { redirect } from "next/navigation";
import { getAuthenticatedUser, requireAuthenticatedClientLead } from "@/lib/auth";
import { IntakeShell } from "@/components/client/intake/IntakeShell";
import { ProfileStepForm } from "@/components/client/intake/ProfileStepForm";
import { requireIntakeStepAccess } from "@/lib/services/intakeService";

export const dynamic = "force-dynamic";

export default async function IntakeProfilePage() {
  const session = await getAuthenticatedUser();
  const lead = await requireAuthenticatedClientLead();

  if (!session) {
    redirect("/login?next=/intake/profile");
  }

  const model = await requireIntakeStepAccess({
    userId: session.user.id,
    lead,
    step: "profile",
  });

  return (
    <IntakeShell model={model}>
      <ProfileStepForm model={model} />
    </IntakeShell>
  );
}
