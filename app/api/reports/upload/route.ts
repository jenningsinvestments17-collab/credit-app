import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClientLead } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/security/api";
import {
  assertAllowedFile,
  assertSameOrigin,
  getSafeString,
  sanitizeRelativePath,
} from "@/lib/security/request";
import { processDocumentUpload } from "@/lib/services/reportUpload";
import type { RequiredDocumentKey } from "@/lib/types";

const ALLOWED_KEYS: RequiredDocumentKey[] = [
  "experian_report",
  "equifax_report",
  "transunion_report",
  "valid_id",
  "proof_of_address",
];

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const lead = await getAuthenticatedClientLead();

    if (!lead) {
      return jsonError("Unauthorized.", 401);
    }

    const formData = await request.formData();
    const leadId = getSafeString(formData.get("leadId"), 120);
    const documentKey = getSafeString(formData.get("documentKey"), 60) as RequiredDocumentKey;
    const returnTo = sanitizeRelativePath(getSafeString(formData.get("returnTo"), 200), "/intake");
    const file = formData.get("file");

    if (lead.id !== leadId) {
      return jsonError("Unauthorized.", 403);
    }

    if (!leadId || !ALLOWED_KEYS.includes(documentKey) || !(file instanceof File)) {
      return NextResponse.redirect(new URL(`${returnTo}?uploadError=1`, request.url));
    }

    const isBureauReport =
      documentKey === "experian_report" ||
      documentKey === "equifax_report" ||
      documentKey === "transunion_report";

    assertAllowedFile(file, {
      maxBytes: 10 * 1024 * 1024,
      extensions: isBureauReport ? [".pdf"] : [".pdf", ".png", ".jpg", ".jpeg"],
      mimeTypes: isBureauReport
        ? ["application/pdf"]
        : ["application/pdf", "image/png", "image/jpeg"],
    });

    await processDocumentUpload({
      lead,
      documentKey,
      file,
    });

    return NextResponse.redirect(new URL(`${returnTo}?uploaded=${documentKey}`, request.url));
  } catch (error) {
    return handleApiError(error);
  }
}
