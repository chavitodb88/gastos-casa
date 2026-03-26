import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export function getAccounts() {
  return db
    .select()
    .from(accounts)
    .orderBy(desc(accounts.isDefault), asc(accounts.name))
    .all();
}

export function getDefaultAccount() {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.isDefault, true))
    .get();
}

export function createAccount(data: {
  name: string;
  bank: string;
  color?: string | null;
  icon?: string | null;
  isDefault?: boolean;
}) {
  return db
    .insert(accounts)
    .values({
      name: data.name,
      bank: data.bank,
      color: data.color ?? null,
      icon: data.icon ?? null,
      isDefault: data.isDefault ?? false,
    })
    .returning()
    .get();
}

export function updateAccount(
  id: number,
  data: Partial<{
    name: string;
    bank: string;
    color: string | null;
    icon: string | null;
    isDefault: boolean;
  }>
) {
  return db
    .update(accounts)
    .set(data)
    .where(eq(accounts.id, id))
    .returning()
    .get();
}

export function deleteAccount(id: number) {
  return db
    .delete(accounts)
    .where(eq(accounts.id, id))
    .returning()
    .get();
}
