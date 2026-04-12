import { db } from "@/db";
import { debts, transactions, accounts, categories } from "@/db/schema";
import { eq, and, desc, type SQL } from "drizzle-orm";
import type { DebtInput, SettleDebtInput } from "@/lib/validators";

interface DebtFilters {
  type?: string;
  status?: string;
  personName?: string;
}

export function getDebts(filters: DebtFilters = {}) {
  const conditions: SQL[] = [];

  if (filters.type) {
    conditions.push(eq(debts.type, filters.type as "RECEIVABLE" | "PAYABLE"));
  }

  if (filters.status) {
    conditions.push(eq(debts.status, filters.status as "PENDING" | "SETTLED"));
  }

  if (filters.personName) {
    conditions.push(eq(debts.personName, filters.personName));
  }

  const query = db
    .select({
      id: debts.id,
      type: debts.type,
      personName: debts.personName,
      description: debts.description,
      amount: debts.amount,
      date: debts.date,
      dueDate: debts.dueDate,
      status: debts.status,
      settledAt: debts.settledAt,
      transactionId: debts.transactionId,
      notes: debts.notes,
      createdAt: debts.createdAt,
      updatedAt: debts.updatedAt,
      accountName: accounts.name,
      accountColor: accounts.color,
      categoryName: categories.name,
    })
    .from(debts)
    .leftJoin(transactions, eq(debts.transactionId, transactions.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .orderBy(desc(debts.date));

  if (conditions.length > 0) {
    return query.where(and(...conditions)).all();
  }

  return query.all();
}

export function getDebtById(id: number) {
  return db
    .select()
    .from(debts)
    .where(eq(debts.id, id))
    .get();
}

export function createDebt(data: DebtInput) {
  return db
    .insert(debts)
    .values({
      type: data.type,
      personName: data.personName,
      description: data.description,
      amount: data.amount,
      date: data.date,
      dueDate: data.dueDate ?? null,
      notes: data.notes ?? null,
    })
    .returning()
    .get();
}

export function updateDebt(id: number, data: Partial<DebtInput>) {
  return db
    .update(debts)
    .set({
      ...data,
      dueDate: data.dueDate ?? undefined,
      notes: data.notes ?? undefined,
    })
    .where(eq(debts.id, id))
    .returning()
    .get();
}

export function deleteDebt(id: number) {
  return db
    .delete(debts)
    .where(eq(debts.id, id))
    .returning()
    .get();
}

export function settleDebt(id: number, data: SettleDebtInput) {
  const debt = getDebtById(id);
  if (!debt) return null;
  if (debt.status === "SETTLED") return null;

  // Create the corresponding transaction
  const txType = debt.type === "RECEIVABLE" ? "INCOME" : "EXPENSE";
  const description = `${debt.type === "RECEIVABLE" ? "Cobro" : "Pago"}: ${debt.personName} - ${debt.description}`;

  const tx = db
    .insert(transactions)
    .values({
      date: data.date,
      type: txType,
      amount: debt.amount,
      description,
      isPaid: true,
      categoryId: data.categoryId ?? null,
      accountId: data.accountId,
      source: "MANUAL",
      notes: `debt_id:${debt.id}`,
    })
    .returning()
    .get();

  // Mark debt as settled
  return db
    .update(debts)
    .set({
      status: "SETTLED",
      settledAt: data.date,
      transactionId: tx.id,
    })
    .where(eq(debts.id, id))
    .returning()
    .get();
}

export function getPersonNames() {
  return db
    .selectDistinct({ personName: debts.personName })
    .from(debts)
    .orderBy(debts.personName)
    .all()
    .map((r) => r.personName);
}
