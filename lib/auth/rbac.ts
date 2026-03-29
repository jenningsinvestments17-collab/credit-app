import type { RoleCode } from "@prisma/client";

export function getPrimaryRole(user: {
  userType: "client" | "admin";
  roles: Array<{ role: { code: RoleCode } }>;
}) {
  const codes = user.roles.map((entry) => entry.role.code);

  if (codes.includes("super_admin")) {
    return "super_admin" as const;
  }

  if (codes.includes("admin")) {
    return "admin" as const;
  }

  return "client" as const;
}

export function hasRequiredRole(
  role: "client" | "admin" | "super_admin",
  required: "client" | "admin" | "super_admin",
) {
  if (required === "client") {
    return ["client", "admin", "super_admin"].includes(role);
  }

  if (required === "admin") {
    return ["admin", "super_admin"].includes(role);
  }

  return role === "super_admin";
}
