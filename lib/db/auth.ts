import { RoleCode, SessionStatus, UserType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export { RoleCode, SessionStatus, UserType };

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      credential: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      credential: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
}

export async function createUserWithCredential(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: UserType;
  passwordHash: string;
  roleCode: RoleCode;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpiresAt?: Date | null;
  emailVerifiedAt?: Date | null;
}) {
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({
      where: { code: input.roleCode },
    });

    if (!role) {
      throw new Error("Role bootstrap is incomplete.");
    }

    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        emailVerifiedAt: input.emailVerifiedAt ?? null,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        userType: input.userType,
        credential: {
          create: {
            passwordHash: input.passwordHash,
            emailVerificationTokenHash: input.emailVerificationTokenHash,
            emailVerificationExpiresAt: input.emailVerificationExpiresAt,
          },
        },
      },
    });

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        credential: true,
        roles: { include: { role: true } },
      },
    });
  });
}

export async function updateCredentialByUserId(
  userId: string,
  data: Prisma.UserCredentialUncheckedUpdateInput,
) {
  return prisma.userCredential.update({
    where: { userId },
    data,
  });
}

export async function markEmailVerified(userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
      },
    });

    await tx.userCredential.update({
      where: { userId },
      data: {
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });
  });
}

export async function createSessionRecord(input: {
  id?: string;
  userId: string;
  sessionTokenHash: string;
  csrfSecretHash?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
}) {
  return prisma.session.create({
    data: {
      id: input.id,
      userId: input.userId,
      sessionTokenHash: input.sessionTokenHash,
      csrfSecretHash: input.csrfSecretHash ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      expiresAt: input.expiresAt,
    },
  });
}

export async function findActiveSessionById(sessionId: string) {
  return prisma.session.findFirst({
    where: {
      id: sessionId,
      status: SessionStatus.active,
    },
    include: {
      user: {
        include: {
          roles: { include: { role: true } },
        },
      },
    },
  });
}

export async function revokeSession(sessionId: string) {
  return prisma.session.updateMany({
    where: {
      id: sessionId,
      status: SessionStatus.active,
    },
    data: {
      status: SessionStatus.revoked,
      revokedAt: new Date(),
    },
  });
}

export async function revokeAllUserSessions(userId: string) {
  return prisma.session.updateMany({
    where: {
      userId,
      status: SessionStatus.active,
    },
    data: {
      status: SessionStatus.revoked,
      revokedAt: new Date(),
    },
  });
}

export async function touchSession(sessionId: string) {
  return prisma.session.update({
    where: { id: sessionId },
    data: {
      lastSeenAt: new Date(),
    },
  });
}

export async function ensureCoreRoles() {
  const roles = [
    { code: RoleCode.client, name: "Client" },
    { code: RoleCode.admin, name: "Admin" },
    { code: RoleCode.super_admin, name: "Super Admin" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: role,
      update: { name: role.name },
    });
  }
}

export async function listAdminUsers() {
  return prisma.user.findMany({
    where: {
      userType: UserType.admin,
      deletedAt: null,
    },
    include: {
      roles: {
        include: { role: true },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
