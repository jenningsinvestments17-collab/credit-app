import { redirect } from "next/navigation";
import { getAuthenticatedUser, requireAuthenticatedClientLead } from "@/lib/auth";
import { DisclosuresStep } from "@/components/client/intake/DisclosuresStep";
import { IntakeShell } from "@/components/client/intake/IntakeShell";
import { requireIntakeStepAccess } from "@/lib/services/intakeService";

export const dynamic = "force-dynamic";

export default async function IntakeDisclosuresPage() {
  const session = await getAuthenticatedUser();
  const lead = await requireAuthenticatedClientLead();

  if (!session) {
    redirect("/login?next=/intake/disclosures");
  }

  const model = await requireIntakeStepAccess({
    userId: session.user.id,
    lead,
    step: "disclosures",
  });

  return (
    <IntakeShell model={model}>
      <DisclosuresStep model={model} />
    </IntakeShell>
  );
}
