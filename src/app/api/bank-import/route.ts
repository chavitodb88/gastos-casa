import { NextResponse } from "next/server";
import { eq, and, like, sql, inArray } from "drizzle-orm";
import { parseBankExcelBuffer } from "@/lib/bank-import-parser";
import { db } from "@/db";
import { transactions, importBatches } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const accountId = formData.get("accountId")
      ? Number(formData.get("accountId"))
      : null;
    const cashAccountIdRaw = formData.get("cashAccountId");
    const cashAccountId =
      cashAccountIdRaw && cashAccountIdRaw !== "none"
        ? Number(cashAccountIdRaw)
        : null;

    if (!file) {
      return NextResponse.json(
        { error: "No se ha proporcionado un archivo" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseBankExcelBuffer(buffer, file.name);

    // Check for duplicates by UID
    const allUids = parsed.map((r) => r.uid);
    const existingUids = checkDuplicateUids(allUids);

    // Check for matches with existing transactions (fijos)
    const matchResults = findMatchingTransactions(parsed);

    const rowsWithStatus = parsed.map((row, i) => ({
      ...row,
      isDuplicate: existingUids.has(row.uid),
      matchedTransactionId: matchResults[i]?.id ?? null,
      matchedDescription: matchResults[i]?.description ?? null,
      matchAction: matchResults[i] ? "mark_paid" as const : null,
    }));

    if (action === "preview") {
      return NextResponse.json({ rows: rowsWithStatus });
    }

    if (action === "confirm") {
      const ignoredUidsRaw = formData.get("ignoredUids");
      const ignoredUids: Set<string> = new Set(
        ignoredUidsRaw ? JSON.parse(ignoredUidsRaw as string) : []
      );

      // If there are transfer rows (cash withdrawals) to import, cashAccountId is required
      const hasTransfersToImport = rowsWithStatus.some(
        (r) =>
          r.type === "TRANSFER" && !r.isDuplicate && !ignoredUids.has(r.uid)
      );
      if (hasTransfersToImport && cashAccountId == null) {
        return NextResponse.json(
          {
            error:
              "Hay retiradas de efectivo en el archivo. Selecciona la cuenta de efectivo de destino o ignóralas.",
          },
          { status: 400 }
        );
      }

      let imported = 0;
      let matched = 0;
      let duplicatesSkipped = 0;
      let userIgnored = 0;

      for (let i = 0; i < rowsWithStatus.length; i++) {
        const item = rowsWithStatus[i];

        if (item.isDuplicate) { duplicatesSkipped++; continue; }
        if (ignoredUids.has(item.uid)) { userIgnored++; continue; }

        if (item.matchedTransactionId) {
          // Mark existing transaction as paid and update amount if needed
          db.update(transactions)
            .set({
              isPaid: true,
              amount: item.amount,
              notes: `Importado del banco. ${item.description}`,
            })
            .where(eq(transactions.id, item.matchedTransactionId))
            .run();
          matched++;
        } else {
          // Insert as new transaction
          db.insert(transactions)
            .values({
              date: item.date,
              type: item.type,
              amount: item.amount,
              description: item.description,
              isPaid: true,
              isFixed: false,
              categoryId: null,
              accountId: accountId,
              toAccountId: item.type === "TRANSFER" ? cashAccountId : null,
              source: "BANK_IMPORT",
              notes: `bank_uid:${item.uid}`,
            })
            .run();
          imported++;
        }
      }

      const batchResult = db
        .insert(importBatches)
        .values({
          filename: file.name,
          rowCount: imported + matched,
          duplicatesSkipped,
        })
        .returning()
        .get();

      return NextResponse.json(
        {
          batchId: batchResult.id,
          imported,
          matched,
          duplicatesSkipped,
          autoIgnored: userIgnored,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Parámetro action inválido. Usa 'preview' o 'confirm'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error importing bank transactions:", error);
    return NextResponse.json(
      { error: "Error al importar las transacciones bancarias" },
      { status: 500 }
    );
  }
}

function checkDuplicateUids(uids: string[]): Set<string> {
  if (uids.length === 0) return new Set();

  const notePatterns = uids.map((uid) => `bank_uid:${uid}`);
  const batchSize = 100;
  const existing = new Set<string>();

  for (let i = 0; i < notePatterns.length; i += batchSize) {
    const batch = notePatterns.slice(i, i + batchSize);
    const found = db
      .select({ notes: transactions.notes })
      .from(transactions)
      .where(
        and(
          eq(transactions.source, "BANK_IMPORT"),
          inArray(transactions.notes, batch)
        )
      )
      .all();

    for (const row of found) {
      if (row.notes?.startsWith("bank_uid:")) {
        existing.add(row.notes.replace("bank_uid:", ""));
      }
    }
  }

  return existing;
}

interface MatchResult {
  id: number;
  description: string;
}

function findMatchingTransactions(
  parsed: { date: string; amount: number; type: string; description: string }[]
): (MatchResult | null)[] {
  return parsed.map((item) => {
    // Look for an existing unpaid transaction in the same month with similar amount (±2€)
    const monthPrefix = item.date.substring(0, 7) + "%";

    const candidates = db
      .select({
        id: transactions.id,
        description: transactions.description,
        amount: transactions.amount,
        date: transactions.date,
      })
      .from(transactions)
      .where(
        and(
          like(transactions.date, monthPrefix),
          sql`${transactions.type} = ${item.type}`,
          eq(transactions.isPaid, false),
          sql`ABS(${transactions.amount} - ${item.amount}) <= 2`
        )
      )
      .all();

    if (candidates.length === 0) return null;

    // If only one match, use it
    if (candidates.length === 1) return { id: candidates[0].id, description: candidates[0].description };

    // If multiple, try to find best match by date proximity
    const itemDate = new Date(item.date).getTime();
    candidates.sort((a, b) => {
      const diffA = Math.abs(new Date(a.date).getTime() - itemDate);
      const diffB = Math.abs(new Date(b.date).getTime() - itemDate);
      return diffA - diffB;
    });

    return { id: candidates[0].id, description: candidates[0].description };
  });
}
