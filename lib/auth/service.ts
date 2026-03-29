import { RoleCode, UserType } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db/prisma";
import { getLeadByEmail } from "@/lib/leads";
import {
  createUserWithCredential,
  ensureCoreRoles,
  findUserByEmail,
  findUserById,
  markEmailVerified,
  revokeAllUserSessions,
  updateCredentialByUserId,
} from "@/lib/db/auth";
import { hashPassword, verifyPassword } from "@/lib/security/passwords";
import { hashOpaqueToken, createOpaqueToken } from "@/lib/auth/tokens";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { issueAuthSession } from "@/lib/auth/session";
import { trackAccountCreated } from "@/lib/services/analytics";
import { queueAccountCreatedNotifications } from "@/lib/services/notifications";

function nowPlus(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export async function ensureAuthBootstrap() {
  await ensureCoreRoles();

  const existing = await findUserByEmail(env.ADMIN_BOOTSTRAP_EMAIL);

  if (existing) {
    return existing;
  }

  return createUserWithCredential({
    email: env.ADMIN_BOOTSTRAP_EMAIL,
    firstName: "Platform",
    lastName: "Owner",
    userType: UserType.admin,
    passwordHash: await hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD),
    roleCode: RoleCode.super_admin,
    emailVerifiedAt: new Date(),
  });
}

export async function registerClientAccount(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
}) {
  await ensureAuthBootstrap();
  const existingLead = getLeadByEmail(input.email);

  if (!existingLead) {
    throw new Error("We could not match that email to an existing client file yet.");
  }

  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new Error("An account with that email already exists.");
  }

  const verificationToken = createOpaqueToken(32);
  const user = await createUserWithCredential({
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    userType: UserType.client,
    passwordHash: await hashPassword(input.password),
    roleCode: RoleCode.client,
    emailVerificationTokenHash: hashOpaqueToken(verificationToken),
    emailVerificationExpiresAt: nowPlus(24),
  });

  await trackAccountCreated(user.id, {
    userType: "client",
    hasLeadMatch: true,
  });
  await queueAccountCreatedNotifications({
    userId: user.id,
    email: user.email,
    phone: user.phone ?? undefined,
  });

  return {
    user,
    verificationToken,
  };
}

export async function verifyEmailAddress(token: string) {
  const tokenHash = hashOpaqueToken(token);
  const user = await findUserByCredentialToken("emailVerificationTokenHash", tokenHash);

  if (!user?.credential || !user.credential.emailVerificationExpiresAt) {
    throw new Error("Verification token is invalid or expired.");
  }

  if (user.credential.emailVerificationExpiresAt.getTime() < Date.now()) {
    throw new Error("Verification token is invalid or expired.");
  }

  await markEmailVerified(user.id);
  return user;
}

async function findUserByCredentialToken(
  field: "emailVerificationTokenHash" | "passwordResetTokenHash",
  tokenHash: string,
) {
  return prisma.user.findFirst({
    where: {
      credential: {
        is: {
          [field]: tokenHash,
        },
      },
    },
    include: {
      credential: true,
      roles: { include: { role: true } },
    },
  });
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
  scope: "client" | "admin";
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await ensureAuthBootstrap();
  const user = await findUserByEmail(input.email);

  if (!user?.credential) {
    return null;
  }

  const role = getPrimaryRole({
    userType: user.userType,
    roles: user.roles,
  });

  if (input.scope === "client" && user.userType !== UserType.client) {
    return null;
  }

  if (input.scope === "admin" && !["admin", "super_admin"].includes(role)) {
    return null;
  }

  const valid = await verifyPassword(input.password, user.credential.passwordHash);

  if (!valid) {
    await updateCredentialByUserId(user.id, {
      failedLoginCount: { increment: 1 },
    });
    return null;
  }

  await updateCredentialByUserId(user.id, {
    failedLoginCount: 0,
    lockedUntil: null,
  });
  await revokeAllUserSessions(user.id);

  await issueAuthSession({
    userId: user.id,
    userType: user.userType,
    role,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return user;
}

export async function createPasswordResetRequest(email: string) {
  await ensureAuthBootstrap();
  const user = await findUserByEmail(email);

  if (!user?.credential) {
    return {
      ok: true,
      resetToken: null as string | null,
    };
  }

  const token = createOpaqueToken(32);

  await updateCredentialByUserId(user.id, {
    passwordResetTokenHash: hashOpaqueToken(token),
    passwordResetExpiresAt: nowPlus(1),
    passwordResetRequestedAt: new Date(),
  });

  return {
    ok: true,
    resetToken: token,
  };
}

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
}) {
  const tokenHash = hashOpaqueToken(input.token);
  const user = await findUserByCredentialToken("passwordResetTokenHash", tokenHash);

  if (!user?.credential || !user.credential.passwordResetExpiresAt) {
    throw new Error("Reset token is invalid or expired.");
  }

  if (user.credential.passwordResetExpiresAt.getTime() < Date.now()) {
    throw new Error("Reset token is invalid or expired.");
  }

  await updateCredentialByUserId(user.id, {
    passwordHash: await hashPassword(input.password),
    passwordUpdatedAt: new Date(),
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    passwordResetRequestedAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
  });
  await revokeAllUserSessions(user.id);

  return findUserById(user.id);
}

export async function createAdminAccountFromAuth(input: {
  email: string;
  password: string;
  role: "admin" | "super_admin";
  firstName?: string;
  lastName?: string;
}) {
  const existing = await findUserByEmail(input.email);

  if (existing) {
    throw new Error("An admin with that email already exists.");
  }

  return createUserWithCredential({
    email: input.email,
    firstName: input.firstName || "Admin",
    lastName: input.lastName || "User",
    userType: UserType.admin,
    passwordHash: await hashPassword(input.password),
    roleCode: input.role === "super_admin" ? RoleCode.super_admin : RoleCode.admin,
    emailVerifiedAt: new Date(),
  });
}
