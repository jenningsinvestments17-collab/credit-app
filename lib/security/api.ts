import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { RequestValidationError } from "@/lib/security/request";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof RequestValidationError) {
    return jsonError(error.message, error.status);
  }

  return jsonError(
    env.NODE_ENV === "production"
      ? "Request could not be completed."
      : error instanceof Error
        ? error.message
        : "Request could not be completed.",
    400,
  );
}
