import { redirect } from "next/navigation";
import { getAuthenticatedUser, requireAuthenticatedClientLead } from "@/lib/auth";
import { DocumentsStep } from "@/components/client/intake/DocumentsStep";
import { IntakeShell } from "@/components/client/intake/IntakeShell";
import { requireIntakeStepAccess } from "@/lib/services/intakeService";

export const dynamic = "force-dynamic";

export default async function IntakeDocumentsPage({
  searchParams,
}: {
  searchParams?: { uploaded?: string; uploadError?: string };
}) {
  const session = await getAuthenticatedUser();
  const lead = await requireAuthenticatedClientLead();

  if (!session) {
    redirect("/login?next=/intake/documents");
  }

  const model = await requireIntakeStepAccess({
    userId: session.user.id,
    lead,
    step: "documents",
    searchParams,
  });

  return (
    <IntakeShell model={model}>
      <DocumentsStep model={model} />
    </IntakeShell>
  );
}
