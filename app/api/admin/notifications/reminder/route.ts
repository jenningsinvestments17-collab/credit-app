import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/security/api";
import { assertSameOrigin, sanitizeRelativePath } from "@/lib/security/request";
import { queueAdminFollowUpReminder } from "@/lib/services/notifications";

const reminderSchema = z.object({
  userId: z.string().trim().min(1).max(80),
  reason: z.enum(["payment_required", "missing_documents", "stalled_case"]),
  returnTo: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return jsonError("Unauthorized.", 401);
    }

    const formData = await request.formData();
    const parsed = reminderSchema.safeParse({
      userId: formData.get("userId"),
      reason: formData.get("reason"),
      returnTo: formData.get("returnTo"),
    });

    if (!parsed.success) {
      return jsonError("Invalid reminder request.", 400);
    }

    await queueAdminFollowUpReminder({
      userId: parsed.data.userId,
      reason: parsed.data.reason,
    });

    const returnTo = sanitizeRelativePath(parsed.data.returnTo, "/admin");
    const url = new URL(returnTo, request.url);
    url.searchParams.set("reminder", "queued");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    return handleApiError(error);
  }
}
