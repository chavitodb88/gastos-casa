import { db } from "@/db";
import { merchantMappings, cardTransactions, categories } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import type { MerchantMappingInput } from "@/lib/validators";

export function getMerchantMappings() {
  return db
    .select({
      id: merchantMappings.id,
      merchantPattern: merchantMappings.merchantPattern,
      categoryId: merchantMappings.categoryId,
      createdAt: merchantMappings.createdAt,
      updatedAt: merchantMappings.updatedAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(merchantMappings)
    .leftJoin(categories, eq(merchantMappings.categoryId, categories.id))
    .all();
}

export function createMerchantMapping(data: MerchantMappingInput) {
  return db
    .insert(merchantMappings)
    .values({
      merchantPattern: data.merchantPattern,
      categoryId: data.categoryId,
    })
    .returning()
    .get();
}

export function updateMerchantMapping(id: number, data: Partial<MerchantMappingInput>) {
  return db
    .update(merchantMappings)
    .set(data)
    .where(eq(merchantMappings.id, id))
    .returning()
    .get();
}

export function deleteMerchantMapping(id: number) {
  return db
    .delete(merchantMappings)
    .where(eq(merchantMappings.id, id))
    .returning()
    .get();
}

export function recategorizeUnmapped(): number {
  const mappings = db.select().from(merchantMappings).all();

  if (mappings.length === 0) return 0;

  // Find card transactions without category
  const unmapped = db
    .select({
      id: cardTransactions.id,
      merchant: cardTransactions.merchant,
    })
    .from(cardTransactions)
    .where(isNull(cardTransactions.categoryId))
    .all();

  let updated = 0;

  for (const tx of unmapped) {
    const upperMerchant = tx.merchant.toUpperCase();

    for (const mapping of mappings) {
      if (upperMerchant.includes(mapping.merchantPattern.toUpperCase())) {
        db.update(cardTransactions)
          .set({ categoryId: mapping.categoryId })
          .where(eq(cardTransactions.id, tx.id))
          .run();

        updated++;
        break;
      }
    }
  }

  return updated;
}
