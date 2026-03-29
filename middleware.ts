import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { getEdgeClientIp, readEdgeSessionCookie } from "@/lib/security/edgeRequest";

const AUTH_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000, label: "authentication" };
const API_LIMIT = { limit: 50, windowMs: 60 * 1000, label: "api" };
const AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/admin/login",
  "/api/auth/register",
  "/api/auth/password-reset/request",
  "/api/auth/password-reset/confirm",
  "/api/auth/verify-email",
]);
const SENSITIVE_API_PATHS = new Set([
  "/api/reports/upload",
  "/api/mailing/send",
  "/api/admin/notifications/reminder",
]);
const SENSITIVE_API_PREFIXES = ["/api/disputes/"];
const CLIENT_PROTECTED_PATHS = ["/dashboard", "/dashboard/contracts", "/intake"];
const AUTH_REDIRECTS: Record<string, string> = {
  "/api/auth/login": "/login",
  "/api/auth/admin/login": "/admin/login",
  "/api/auth/register": "/register",
  "/api/auth/password-reset/request": "/forgot-password",
  "/api/auth/password-reset/confirm": "/reset-password",
  "/api/auth/verify-email": "/verify-email",
};

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

async function checkAuthRateLimit(request: NextRequest, input: {
  key: string;
  limit: number;
  windowMs: number;
  label: string;
}) {
  const secret = process.env.APP_SESSION_SECRET?.trim();
  if (!secret) {
    return {
      limited: false,
      retryAfter: 0,
      remaining: input.limit,
      resetAt: Date.now() + input.windowMs,
    };
  }

  const origin = request.nextUrl.origin;
  try {
    const response = await fetch(`${origin}/api/internal/rate-limit`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-rate-limit": secret,
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        limited: false,
        retryAfter: 0,
        remaining: input.limit,
        resetAt: Date.now() + input.windowMs,
      };
    }

    return {
      limited: Boolean(data?.limited),
      retryAfter: Number(data?.retryAfter ?? 0),
      remaining: Number(data?.remaining ?? input.limit),
      resetAt: Number(data?.resetAt ?? Date.now()),
    };
  } catch {
    // Fail open here so a missing or unhealthy Redis-backed limiter never takes down page loads.
    // Sensitive auth routes still have route-level protection in the auth handlers.
    return {
      limited: false,
      retryAfter: 0,
      remaining: input.limit,
      resetAt: Date.now() + input.windowMs,
    };
  }
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

function expectsJsonResponse(request: NextRequest) {
  const accept = request.headers.get("accept")?.toLowerCase() ?? "";
  const requestedWith = request.headers.get("x-requested-with")?.toLowerCase() ?? "";
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (requestedWith === "xmlhttprequest") {
    return true;
  }

  if (contentType.includes("application/json")) {
    return true;
  }

  return accept.includes("application/json") && !accept.includes("text/html");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/intake") ||
    pathname.startsWith("/admin");

  if (!isApi && !isProtectedPage) {
    return NextResponse.next();
  }

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const isAuthRoute = AUTH_PATHS.has(pathname);
  const isSensitiveApiRoute =
    SENSITIVE_API_PATHS.has(pathname) ||
    SENSITIVE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  let rateResult = {
    limited: false,
    retryAfter: 0,
    remaining: API_LIMIT.limit,
    resetAt: Date.now() + API_LIMIT.windowMs,
  };

  if (isAuthRoute || isSensitiveApiRoute) {
    const ip = getEdgeClientIp(request.headers, env.TRUST_PROXY);
    const appliedLimit = isAuthRoute ? AUTH_LIMIT : API_LIMIT;
    rateResult = await checkAuthRateLimit(request, {
      key: `${appliedLimit.label}:${ip}:${pathname}`,
      limit: appliedLimit.limit,
      windowMs: appliedLimit.windowMs,
      label: appliedLimit.label,
    });

    if (rateResult.limited) {
      if (isAuthRoute && !expectsJsonResponse(request)) {
        const redirectPath = AUTH_REDIRECTS[pathname] ?? "/login";
        const url = new URL(redirectPath, request.url);
        url.searchParams.set("error", "rate_limited");
        return NextResponse.redirect(url, 303);
      }

      return NextResponse.json(
        {
          error: "Too many requests.",
          code: "rate_limited",
          message: isAuthRoute
            ? "Too many authentication attempts. Please wait and try again."
            : "Too many API requests. Please wait and try again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateResult.retryAfter || 60),
          },
        },
      );
    }
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
  response.headers.set(
    "X-RateLimit-Limit",
    String(isAuthRoute ? AUTH_LIMIT.limit : isSensitiveApiRoute ? API_LIMIT.limit : API_LIMIT.limit),
  );
  response.headers.set("X-RateLimit-Remaining", String(rateResult.remaining));
  response.headers.set("X-RateLimit-Reset", String(rateResult.resetAt));
  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/intake/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
