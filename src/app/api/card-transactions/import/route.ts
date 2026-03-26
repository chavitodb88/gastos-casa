import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { parseExcelBuffer } from "@/lib/import-parser";
import { importCardTransactions } from "@/services/card-transactions";
import { db } from "@/db";
import { importBatches, cardTransactions } from "@/db/schema";

function findDuplicates(parsed: { date: string; merchant: string; amount: number }[]) {
  const dupeSet = new Set<number>();

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    const existing = db
      .select({ id: cardTransactions.id })
      .from(cardTransactions)
      .where(
        and(
          eq(cardTransactions.date, item.date),
          eq(cardTransactions.merchant, item.merchant),
          sql`ABS(${cardTransactions.amount} - ${item.amount}) < 0.01`
        )
      )
      .get();

    if (existing) {
      dupeSet.add(i);
    }
  }

  return dupeSet;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se ha proporcionado un archivo" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcelBuffer(buffer, file.name);

    // Detect duplicates by date + merchant + amount
    const dupeIndices = findDuplicates(parsed);
    parsed.forEach((item, i) => {
      item.isDuplicate = dupeIndices.has(i);
    });

    if (action === "preview") {
      return NextResponse.json({ rows: parsed });
    }

    if (action === "confirm") {
      const nonDuplicates = parsed.filter((_, i) => !dupeIndices.has(i));

      const batch = db
        .insert(importBatches)
        .values({
          filename: file.name,
          rowCount: parsed.length,
          duplicatesSkipped: dupeIndices.size,
        })
        .returning()
        .get();

      const result = importCardTransactions(nonDuplicates, batch.id);

      return NextResponse.json({
        batchId: batch.id,
        imported: result.imported,
        duplicatesSkipped: dupeIndices.size + result.skipped,
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Parámetro action inválido. Usa 'preview' o 'confirm'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error importing card transactions:", error);
    return NextResponse.json(
      { error: "Error al importar las transacciones de tarjeta" },
      { status: 500 }
    );
  }
}
