import { redirect } from "next/navigation";
import { getAuthenticatedUser, requireAuthenticatedClientLead } from "@/lib/auth";
import { ContractsStep } from "@/components/client/intake/ContractsStep";
import { IntakeShell } from "@/components/client/intake/IntakeShell";
import { requireIntakeStepAccess } from "@/lib/services/intakeService";

export const dynamic = "force-dynamic";

export default async function IntakeContractsPage() {
  const session = await getAuthenticatedUser();
  const lead = await requireAuthenticatedClientLead();

  if (!session) {
    redirect("/login?next=/intake/contracts");
  }

  const model = await requireIntakeStepAccess({
    userId: session.user.id,
    lead,
    step: "contracts",
  });

  return (
    <IntakeShell model={model}>
      <ContractsStep model={model} />
    </IntakeShell>
  );
}
