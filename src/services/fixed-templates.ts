import { db } from "@/db";
import { fixedTemplates, transactions, categories, accounts } from "@/db/schema";
import { eq, and, like, sql } from "drizzle-orm";
import type { FixedTemplateInput } from "@/lib/validators";

export function getFixedTemplates() {
  return db
    .select({
      id: fixedTemplates.id,
      dayOfMonth: fixedTemplates.dayOfMonth,
      type: fixedTemplates.type,
      amount: fixedTemplates.amount,
      description: fixedTemplates.description,
      categoryId: fixedTemplates.categoryId,
      accountId: fixedTemplates.accountId,
      isActive: fixedTemplates.isActive,
      createdAt: fixedTemplates.createdAt,
      updatedAt: fixedTemplates.updatedAt,
      categoryName: categories.name,
      accountName: accounts.name,
      accountColor: accounts.color,
    })
    .from(fixedTemplates)
    .leftJoin(categories, eq(fixedTemplates.categoryId, categories.id))
    .leftJoin(accounts, eq(fixedTemplates.accountId, accounts.id))
    .all();
}

export function createFixedTemplate(data: FixedTemplateInput) {
  return db
    .insert(fixedTemplates)
    .values({
      dayOfMonth: data.dayOfMonth,
      type: data.type,
      amount: data.amount,
      description: data.description,
      categoryId: data.categoryId ?? null,
      accountId: data.accountId ?? null,
      isActive: data.isActive,
    })
    .returning()
    .get();
}

export function updateFixedTemplate(id: number, data: Partial<FixedTemplateInput>) {
  return db
    .update(fixedTemplates)
    .set({
      ...data,
      categoryId: data.categoryId ?? undefined,
      accountId: data.accountId ?? undefined,
    })
    .where(eq(fixedTemplates.id, id))
    .returning()
    .get();
}

export function deleteFixedTemplate(id: number) {
  return db
    .delete(fixedTemplates)
    .where(eq(fixedTemplates.id, id))
    .returning()
    .get();
}

export function generateFixedForMonth(month: number, year: number) {
  const templates = db
    .select()
    .from(fixedTemplates)
    .where(eq(fixedTemplates.isActive, true))
    .all();

  const datePrefix = `${year}-${String(month).padStart(2, "0")}%`;
  let created = 0;
  let skipped = 0;

  for (const template of templates) {
    // Check for duplicate: same description, same month/year, source=AUTO_FIXED
    const existing = db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.description, template.description),
          eq(transactions.source, "AUTO_FIXED"),
          like(transactions.date, datePrefix)
        )
      )
      .get();

    if (existing) {
      skipped++;
      continue;
    }

    const day = Math.min(template.dayOfMonth, daysInMonth(month, year));
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    db.insert(transactions)
      .values({
        date,
        type: template.type,
        amount: template.amount,
        description: template.description,
        isPaid: false,
        isFixed: true,
        categoryId: template.categoryId,
        accountId: template.accountId,
        source: "AUTO_FIXED",
      })
      .run();

    created++;
  }

  return { created, skipped };
}

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
