import { redirect } from "next/navigation";
import { getAuthenticatedUser, requireAuthenticatedClientLead } from "@/lib/auth";
import { buildIntakeViewModel } from "@/lib/services/intakeService";

export const dynamic = "force-dynamic";

export default async function IntakePage({
  searchParams,
}: {
  searchParams?: { uploaded?: string; uploadError?: string };
}) {
  const session = await getAuthenticatedUser();
  const lead = await requireAuthenticatedClientLead();

  if (!session) {
    redirect("/login?next=/intake/profile");
  }

  const model = await buildIntakeViewModel({
    userId: session.user.id,
    lead,
    step: "profile",
    searchParams,
  });

  redirect(model.resumeHref);
}
