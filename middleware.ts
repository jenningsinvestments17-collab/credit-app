import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { getEdgeClientIp, readEdgeSessionCookie } from "@/lib/security/edgeRequest";

const GLOBAL_LIMIT = { limit: 120, windowMs: 15 * 60 * 1000, label: "requests" };
const AUTH_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000, label: "authentication" };
const AUTH_PATHS = new Set([
  "/login",
  "/admin/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth/login",
  "/api/auth/admin/login",
  "/api/auth/register",
  "/api/auth/password-reset/request",
  "/api/auth/password-reset/confirm",
  "/api/auth/verify-email",
]);
const CLIENT_PROTECTED_PATHS = ["/dashboard", "/dashboard/contracts", "/intake"];

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/api/internal/rate-limit") ||
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff2?|ttf|eot|mp4|webm|mp3)$/i.test(
      pathname,
    )
  );
}

async function checkGlobalRateLimit(request: NextRequest, input: {
  key: string;
  limit: number;
  windowMs: number;
  label: string;
}) {
  const origin = request.nextUrl.origin;
  const response = await fetch(`${origin}/api/internal/rate-limit`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-rate-limit": env.APP_SESSION_SECRET,
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      limited: true,
      retryAfter: Number(data?.retryAfter ?? 60),
      remaining: 0,
      resetAt: Date.now() + 60_000,
    };
  }

  return {
    limited: Boolean(data?.limited),
    retryAfter: Number(data?.retryAfter ?? 0),
    remaining: Number(data?.remaining ?? 0),
    resetAt: Number(data?.resetAt ?? Date.now()),
  };
}

function applySecurityHeaders(response: NextResponse, request: NextRequest) {
  const dev = process.env.NODE_ENV !== "production";
  const scriptSrc = dev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://calendly.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(dev ? [] : ["upgrade-insecure-requests"]),
    ].join("; "),
  );

  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const ip = getEdgeClientIp(request.headers, env.TRUST_PROXY);
  const isAuthRoute = AUTH_PATHS.has(pathname);
  const limit = isAuthRoute ? AUTH_LIMIT : GLOBAL_LIMIT;
  const rateResult = await checkGlobalRateLimit(request, {
    key: `${limit.label}:${ip}:${pathname}`,
    limit: limit.limit,
    windowMs: limit.windowMs,
    label: limit.label,
  });

  if (rateResult.limited) {
    return NextResponse.json(
      {
        error: "Too many requests.",
        code: "rate_limited",
        message: `Too many ${limit.label} attempts. Please wait and try again.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateResult.retryAfter || 60),
        },
      },
    );
  }

  const authPayload = readEdgeSessionCookie(
    request.cookies.get("credu_auth_session")?.value,
  );

  if (CLIENT_PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    if (!authPayload || authPayload.userType !== "client") {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!authPayload || !["admin", "super_admin"].includes(authPayload.role ?? "")) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(limit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateResult.remaining));
  response.headers.set("X-RateLimit-Reset", String(rateResult.resetAt));
  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
