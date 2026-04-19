import type { User } from "@prisma/client";

function adminEmailList(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: Pick<User, "email" | "isAdmin">): boolean {
  if (user.isAdmin) return true;
  const list = adminEmailList();
  if (list.length === 0) return false;
  return list.includes(user.email.toLowerCase());
}
