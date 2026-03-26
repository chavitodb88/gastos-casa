import { db } from "@/db";
import { transactions, categories, accounts } from "@/db/schema";
import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import type { TransactionInput } from "@/lib/validators";

interface TransactionFilters {
  month?: number;
  year?: number;
  type?: string;
  categoryId?: number;
  accountId?: number;
  isPaid?: boolean;
  isFixed?: boolean;
}

export function getTransactions(filters: TransactionFilters = {}) {
  const conditions: SQL[] = [];

  if (filters.month) {
    conditions.push(
      sql`strftime('%m', ${transactions.date}) = ${String(filters.month).padStart(2, "0")}`
    );
  }

  if (filters.year) {
    conditions.push(
      sql`strftime('%Y', ${transactions.date}) = ${String(filters.year)}`
    );
  }

  if (filters.type) {
    conditions.push(eq(transactions.type, filters.type as "INCOME" | "EXPENSE" | "TRANSFER"));
  }

  if (filters.categoryId !== undefined) {
    conditions.push(eq(transactions.categoryId, filters.categoryId));
  }

  if (filters.isPaid !== undefined) {
    conditions.push(eq(transactions.isPaid, filters.isPaid));
  }

  if (filters.isFixed !== undefined) {
    conditions.push(eq(transactions.isFixed, filters.isFixed));
  }

  if (filters.accountId !== undefined) {
    conditions.push(eq(transactions.accountId, filters.accountId));
  }

  const query = db
    .select({
      id: transactions.id,
      date: transactions.date,
      type: transactions.type,
      amount: transactions.amount,
      description: transactions.description,
      isPaid: transactions.isPaid,
      notes: transactions.notes,
      isFixed: transactions.isFixed,
      categoryId: transactions.categoryId,
      accountId: transactions.accountId,
      source: transactions.source,
      cardTransactionId: transactions.cardTransactionId,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      categoryName: categories.name,
      categoryColor: categories.color,
      accountName: accounts.name,
      accountColor: accounts.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .orderBy(desc(transactions.date));

  if (conditions.length > 0) {
    return query.where(and(...conditions)).all();
  }

  return query.all();
}

export function getTransactionById(id: number) {
  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      type: transactions.type,
      amount: transactions.amount,
      description: transactions.description,
      isPaid: transactions.isPaid,
      notes: transactions.notes,
      isFixed: transactions.isFixed,
      categoryId: transactions.categoryId,
      accountId: transactions.accountId,
      source: transactions.source,
      cardTransactionId: transactions.cardTransactionId,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      categoryName: categories.name,
      categoryColor: categories.color,
      accountName: accounts.name,
      accountColor: accounts.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(eq(transactions.id, id))
    .get();
}

export function createTransaction(data: TransactionInput) {
  return db
    .insert(transactions)
    .values({
      date: data.date,
      type: data.type,
      amount: data.amount,
      description: data.description,
      isPaid: data.isPaid,
      notes: data.notes ?? null,
      isFixed: data.isFixed,
      categoryId: data.categoryId ?? null,
      accountId: data.accountId ?? null,
    })
    .returning()
    .get();
}

export function updateTransaction(id: number, data: Partial<TransactionInput>) {
  return db
    .update(transactions)
    .set({
      ...data,
      notes: data.notes ?? undefined,
      categoryId: data.categoryId ?? undefined,
      accountId: data.accountId ?? undefined,
    })
    .where(eq(transactions.id, id))
    .returning()
    .get();
}

export function deleteTransaction(id: number) {
  return db
    .delete(transactions)
    .where(eq(transactions.id, id))
    .returning()
    .get();
}

export function togglePaid(id: number) {
  const current = db
    .select({ isPaid: transactions.isPaid })
    .from(transactions)
    .where(eq(transactions.id, id))
    .get();

  if (!current) return null;

  return db
    .update(transactions)
    .set({ isPaid: !current.isPaid })
    .where(eq(transactions.id, id))
    .returning()
    .get();
}
