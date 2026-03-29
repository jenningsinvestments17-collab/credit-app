import { UploadCard } from "@/components/intake/UploadCard";
import type { IntakeExperienceModel } from "@/lib/services/intakeExperience";
import type { BureauReportRecord, Lead, RequiredDocument } from "@/lib/types";

export function SecureUploadCenter({
  lead,
  documents,
  parsedReports,
  uploadGateCopy,
  returnTo = "/intake#document-upload",
}: {
  lead: Lead | null;
  documents: RequiredDocument[];
  parsedReports: Partial<Record<RequiredDocument["key"], BureauReportRecord | null>>;
  uploadGateCopy: IntakeExperienceModel["uploadGateCopy"];
  returnTo?: string;
}) {
  return (
    <section id="document-upload" className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="space-y-3">
        <p className="eyebrow">Secure upload center</p>
        <h3 className="font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] text-white">
          Required reports and supporting documents.
        </h3>
        <p className="text-sm leading-7 text-zinc-300">{uploadGateCopy}</p>
      </div>

      <div className="mt-5 grid gap-4">
        {documents.map((document) => (
          <UploadCard
            key={document.key}
            document={document}
            leadId={lead?.id ?? null}
            returnTo={returnTo}
            parsedReport={parsedReports[document.key] ?? null}
          />
        ))}
      </div>
    </section>
  );
}
