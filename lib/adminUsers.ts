import { createAdminAccountFromAuth, ensureAuthBootstrap } from "@/lib/auth/service";
import { listAdminUsers, findUserByEmail } from "@/lib/db/auth";
import { getPrimaryRole } from "@/lib/auth/rbac";

export async function listAdminAccounts() {
  await ensureAuthBootstrap();
  const admins = await listAdminUsers();
  return admins.map((admin) => ({
    id: admin.id,
    email: admin.email,
    role: getPrimaryRole({
      userType: admin.userType,
      roles: admin.roles,
    }),
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  }));
}

export async function getAdminAccountByEmail(email: string) {
  await ensureAuthBootstrap();
  const admin = await findUserByEmail(email);

  if (!admin || admin.userType !== "admin") {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    role: getPrimaryRole({
      userType: admin.userType,
      roles: admin.roles,
    }),
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  };
}

export async function authenticateAdminAccount(email: string, password: string) {
  const { loginWithPassword } = await import("@/lib/auth/service");
  return loginWithPassword({
    email,
    password,
    scope: "admin",
  });
}

export async function createAdminAccount(input: {
  email: string;
  password: string;
  role?: "admin" | "super_admin";
}) {
  return createAdminAccountFromAuth({
    email: input.email,
    password: input.password,
    role: input.role ?? "admin",
  });
}
