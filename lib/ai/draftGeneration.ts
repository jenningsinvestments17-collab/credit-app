import { generateDisputeDraftForLead } from "@/lib/ai/generateDisputeDraft";
import { trackAiGeneratedForLead } from "@/lib/services/analytics";
import { queueAiDraftReadyNotifications } from "@/lib/services/notifications";
import type { Lead } from "@/lib/types";

export async function generateTrackedDisputeDraftForLead(lead: Lead) {
  const draft = await generateDisputeDraftForLead(lead);

  if (draft) {
    await trackAiGeneratedForLead(lead, {
      bureau: draft.bureau,
      findingsCount: draft.findings.length,
      draftStatus: draft.status,
    });
    await queueAiDraftReadyNotifications({
      lead,
    });
  }

  return draft;
}
