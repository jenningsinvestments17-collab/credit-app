type HeaderGetter = {
  get(name: string): string | null;
};

export function getEdgeClientIp(headersSource: HeaderGetter, trustProxy: boolean) {
  const forwardedFor = headersSource.get("x-forwarded-for");
  const realIp = headersSource.get("x-real-ip");

  if (trustProxy) {
    const candidate = forwardedFor?.split(",")[0]?.trim() || realIp?.trim();
    if (candidate) {
      return candidate;
    }
  }

  return realIp?.trim() || "local";
}

export function readEdgeSessionCookie(cookieValue: string | undefined | null) {
  if (!cookieValue) {
    return null;
  }

  const [encoded] = cookieValue.split(".");

  if (!encoded) {
    return null;
  }

  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as {
      role?: "client" | "admin" | "super_admin";
      userType?: "client" | "admin";
    };
  } catch {
    return null;
  }
}
