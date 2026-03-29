import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminAccount, getAdminAccountByEmail } from "@/lib/adminUsers";
import { getLeadByEmail } from "@/lib/leads";
import { getPrimaryRole, hasRequiredRole } from "@/lib/auth/rbac";
import { enforceRedisAuthRateLimit } from "@/lib/auth/rateLimit";
import {
  createPasswordResetRequest,
  ensureAuthBootstrap,
  loginWithPassword,
  registerClientAccount,
  resetPasswordWithToken,
  verifyEmailAddress,
} from "@/lib/auth/service";
import {
  clearAuthSessionCookie,
  getAuthenticatedSession,
  revokeCurrentSession,
} from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/db/auth";
import {
  assertCurrentActionOrigin,
  getClientIpFromCurrentHeaders,
  sanitizeRelativePath,
} from "@/lib/security/request";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@/lib/validators/auth";

async function rateLimit(scope: string) {
  const ip = getClientIpFromCurrentHeaders();
  const result = await enforceRedisAuthRateLimit({
    key: `auth:${scope}:${ip}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });

  if (result.limited) {
    throw new Error("Too many attempts. Please wait and try again.");
  }
}

function getUserAgent() {
  return headers().get("user-agent");
}

export async function signInClient(formData: FormData) {
  "use server";

  assertCurrentActionOrigin();
  await ensureAuthBootstrap();
  await rateLimit("client");

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    redirect("/login?error=1");
  }

  const next = sanitizeRelativePath(parsed.data.next, "/dashboard?resume=1");
  const user = await loginWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    scope: "client",
    ipAddress: getClientIpFromCurrentHeaders(),
    userAgent: getUserAgent(),
  });

  if (!user || !user.emailVerifiedAt) {
    redirect("/login?error=1");
  }

  redirect(next);
}

export async function signOutClient() {
  "use server";
  assertCurrentActionOrigin();
  await revokeCurrentSession();
  redirect("/login");
}

export async function signInAdmin(formData: FormData) {
  "use server";

  assertCurrentActionOrigin();
  await ensureAuthBootstrap();
  await rateLimit("admin");

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    redirect("/admin/login?error=1");
  }

  const next = sanitizeRelativePath(parsed.data.next, "/admin");
  const user = await loginWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    scope: "admin",
    ipAddress: getClientIpFromCurrentHeaders(),
    userAgent: getUserAgent(),
  });

  if (!user) {
    redirect("/admin/login?error=1");
  }

  redirect(next);
}

export async function signOutAdmin() {
  "use server";
  assertCurrentActionOrigin();
  await revokeCurrentSession();
  redirect("/admin/login");
}

export async function registerClientAction(formData: FormData) {
  "use server";
  assertCurrentActionOrigin();
  await ensureAuthBootstrap();
  await rateLimit("register");

  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    redirect("/register?error=1");
  }

  try {
    const result = await registerClientAccount(parsed.data);
    const debugToken =
      process.env.NODE_ENV !== "production"
        ? `&token=${encodeURIComponent(result.verificationToken)}`
        : "";
    redirect(`/verify-email?sent=1${debugToken}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "We could not create your account.";
    redirect(`/register?error=${encodeURIComponent(message)}`);
  }
}

export async function forgotPasswordAction(formData: FormData) {
  "use server";
  assertCurrentActionOrigin();
  await rateLimit("forgot-password");

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect("/forgot-password?sent=1");
  }

  const result = await createPasswordResetRequest(parsed.data.email);
  const debugToken =
    process.env.NODE_ENV !== "production" && result.resetToken
      ? `&token=${encodeURIComponent(result.resetToken)}`
      : "";
  redirect(`/forgot-password?sent=1${debugToken}`);
}

export async function resetPasswordAction(formData: FormData) {
  "use server";
  assertCurrentActionOrigin();
  await rateLimit("reset-password");

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/reset-password?error=1");
  }

  try {
    await resetPasswordWithToken({
      token: parsed.data.token,
      password: parsed.data.password,
    });
    redirect("/login?reset=1");
  } catch {
    redirect("/reset-password?error=1");
  }
}

export async function verifyEmailAction(token: string) {
  const parsed = verifyEmailSchema.safeParse({ token });

  if (!parsed.success) {
    return false;
  }

  try {
    await verifyEmailAddress(parsed.data.token);
    return true;
  } catch {
    return false;
  }
}

export async function getAuthenticatedUser() {
  await ensureAuthBootstrap();
  return getAuthenticatedSession();
}

export async function getAuthenticatedClientLead() {
  const session = await getAuthenticatedSession();

  if (!session || session.user.userType !== "client") {
    return null;
  }

  return getLeadByEmail(session.user.email) ?? null;
}

export async function requireAuthenticatedClientLead() {
  const lead = await getAuthenticatedClientLead();

  if (!lead) {
    redirect("/login?next=/dashboard");
  }

  return lead;
}

export async function getAuthenticatedAdmin() {
  const session = await getAuthenticatedSession();

  if (!session) {
    return null;
  }

  const role = getPrimaryRole({
    userType: session.user.userType,
    roles: session.user.roles,
  });

  if (!hasRequiredRole(role, "admin")) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role,
  };
}

export async function requireAuthenticatedAdmin() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/admin/login?next=/admin");
  }

  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireAuthenticatedAdmin();

  if (admin.role !== "super_admin") {
    redirect("/admin");
  }

  return admin;
}

export async function createAdminUserAction(formData: FormData) {
  "use server";

  assertCurrentActionOrigin();
  await requireSuperAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "admin").trim();

  try {
    await createAdminAccount({
      email,
      password,
      role: role === "super_admin" ? "super_admin" : "admin",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create admin account.";
    redirect(`/admin/team?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/team?created=1");
}

export async function getClientSessionEmail() {
  const session = await getAuthenticatedSession();
  return session?.user.email ?? null;
}

export async function getAdminSessionEmail() {
  const admin = await getAuthenticatedAdmin();
  return admin?.email ?? null;
}
