import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/guard";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
};

export async function getManagedUsers(): Promise<ManagedUser[]> {
  if (!(await hasPermission({ user: ["list"] }))) return [];

  const result = await auth.api.listUsers({
    headers: await headers(),
    query: { limit: "100", sortBy: "name", sortDirection: "asc" },
  });

  return result.users.map((managedUser) => ({
    id: managedUser.id,
    name: managedUser.name,
    email: managedUser.email,
    role: managedUser.role,
    banned: managedUser.banned,
  }));
}