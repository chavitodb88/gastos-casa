import { db } from "@/db";
import { cardTransactions, transactions, categories } from "@/db/schema";
import { eq, and, desc, sql, inArray, type SQL } from "drizzle-orm";
import type { ParsedCardTransaction } from "@/lib/import-parser";

interface CardTransactionFilters {
  month?: number;
  year?: number;
  categoryId?: number;
  merchant?: string;
}

export function getCardTransactions(filters: CardTransactionFilters = {}) {
  const conditions: SQL[] = [];

  if (filters.month !== undefined) {
    conditions.push(eq(cardTransactions.month, filters.month));
  }

  if (filters.year !== undefined) {
    conditions.push(eq(cardTransactions.year, filters.year));
  }

  if (filters.categoryId !== undefined) {
    conditions.push(eq(cardTransactions.categoryId, filters.categoryId));
  }

  if (filters.merchant) {
    conditions.push(
      sql`${cardTransactions.merchant} LIKE ${"%" + filters.merchant + "%"}`
    );
  }

  const query = db
    .select({
      id: cardTransactions.id,
      uid: cardTransactions.uid,
      date: cardTransactions.date,
      merchant: cardTransactions.merchant,
      description: cardTransactions.description,
      amount: cardTransactions.amount,
      month: cardTransactions.month,
      year: cardTransactions.year,
      categoryId: cardTransactions.categoryId,
      importBatchId: cardTransactions.importBatchId,
      createdAt: cardTransactions.createdAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(cardTransactions)
    .leftJoin(categories, eq(cardTransactions.categoryId, categories.id))
    .orderBy(desc(cardTransactions.date));

  if (conditions.length > 0) {
    return query.where(and(...conditions)).all();
  }

  return query.all();
}

export function importCardTransactions(
  parsed: ParsedCardTransaction[],
  batchId: number
) {
  const results = { imported: 0, skipped: 0 };

  for (const item of parsed) {
    if (item.isDuplicate) {
      results.skipped++;
      continue;
    }

    // Insert card transaction
    const cardTx = db
      .insert(cardTransactions)
      .values({
        uid: item.uid,
        date: item.date,
        merchant: item.merchant,
        description: item.description,
        amount: item.amount,
        month: item.month,
        year: item.year,
        categoryId: item.suggestedCategoryId,
        importBatchId: batchId,
      })
      .returning()
      .get();

    // Create linked transaction
    db.insert(transactions)
      .values({
        date: item.date,
        type: "EXPENSE",
        amount: item.amount,
        description: item.merchant,
        isPaid: true,
        isFixed: false,
        categoryId: item.suggestedCategoryId,
        accountId: cardTx.accountId,
        source: "CARD_IMPORT",
        cardTransactionId: cardTx.id,
      })
      .run();

    results.imported++;
  }

  return results;
}

export function checkDuplicates(uids: string[]): Set<string> {
  if (uids.length === 0) return new Set();

  const existing = db
    .select({ uid: cardTransactions.uid })
    .from(cardTransactions)
    .where(inArray(cardTransactions.uid, uids))
    .all();

  return new Set(existing.map((row) => row.uid));
}
