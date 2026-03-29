import path from "node:path";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { env } from "@/lib/env";

const SAFE_ID = /^[a-zA-Z0-9_-]{1,120}$/;
const SAFE_FILE = /^[a-zA-Z0-9._-]{1,160}$/;

export class RequestValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type HeaderGetter = {
  get(name: string): string | null;
};

export function getClientIpFromHeaders(headersSource: HeaderGetter) {
  const forwardedFor = headersSource.get("x-forwarded-for");
  const realIp = headersSource.get("x-real-ip");

  if (env.TRUST_PROXY) {
    const candidate = forwardedFor?.split(",")[0]?.trim() || realIp?.trim();
    if (candidate) {
      return candidate;
    }
  }

  return realIp?.trim() || "local";
}

export function getClientIpFromCurrentHeaders() {
  const currentHeaders = headers();
  return getClientIpFromHeaders(currentHeaders);
}

export function sanitizeRelativePath(input: string | null | undefined, fallback: string) {
  const value = (input || "").trim();

  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function assertSafeId(value: string, label = "id") {
  if (!SAFE_ID.test(value)) {
    throw new RequestValidationError(`Invalid ${label}.`);
  }

  return value;
}

export function assertSameOrigin(request: NextRequest) {
  const method = request.method.toUpperCase();

  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return;
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    throw new RequestValidationError("Missing request origin.", 403);
  }

  const expectedOrigin = request.nextUrl.origin;

  if (origin !== expectedOrigin) {
    throw new RequestValidationError("Cross-site request blocked.", 403);
  }
}

export function assertCurrentActionOrigin() {
  const currentHeaders = headers();
  const origin = currentHeaders.get("origin");

  if (!origin) {
    throw new RequestValidationError("Missing request origin.", 403);
  }

  const forwardedProto = currentHeaders.get("x-forwarded-proto");
  const forwardedHost = currentHeaders.get("x-forwarded-host");
  const host = forwardedHost || currentHeaders.get("host");

  if (!host) {
    throw new RequestValidationError("Missing request host.", 403);
  }

  const expectedOrigin = `${forwardedProto || "http"}://${host}`;

  if (origin !== expectedOrigin && origin !== env.APP_BASE_URL && origin !== env.NEXT_PUBLIC_APP_URL) {
    throw new RequestValidationError("Cross-site request blocked.", 403);
  }
}

export function sanitizeUploadFilename(filename: string) {
  const parsed = path.parse(filename);
  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "upload";
  const safeExt = parsed.ext.replace(/[^a-zA-Z0-9.]/g, "").toLowerCase();
  const combined = `${safeName}${safeExt || ".pdf"}`;

  if (!SAFE_FILE.test(combined)) {
    throw new RequestValidationError("Invalid upload filename.");
  }

  return combined;
}

export function assertPdfFile(file: File, maxBytes: number) {
  const validType = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!validType) {
    throw new RequestValidationError("Only PDF uploads are allowed.", 415);
  }

  if (file.size <= 0 || file.size > maxBytes) {
    throw new RequestValidationError("Upload exceeds the allowed size.", 413);
  }
}

export function assertAllowedFile(
  file: File,
  input: { maxBytes: number; extensions: string[]; mimeTypes: string[] },
) {
  const lowerName = file.name.toLowerCase();
  const validType =
    input.mimeTypes.includes(file.type) ||
    input.extensions.some((extension) => lowerName.endsWith(extension));

  if (!validType) {
    throw new RequestValidationError("That file type is not allowed.", 415);
  }

  if (file.size <= 0 || file.size > input.maxBytes) {
    throw new RequestValidationError("Upload exceeds the allowed size.", 413);
  }
}

export function getSafeString(value: FormDataEntryValue | null, maxLength: number) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}
