import * as XLSX from "xlsx";
import { db } from "@/db";
import { merchantMappings } from "@/db/schema";

export interface ParsedCardTransaction {
  uid: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  month: number;
  year: number;
  suggestedCategoryId: number | null;
  isDuplicate: boolean;
}

export interface ParseResult {
  transactions: ParsedCardTransaction[];
  totalAmount: number;
  billingMonth: number;
  billingYear: number;
}

export function parseExcelBuffer(buffer: Buffer, filename: string): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  // Find the header row (contains "Fecha" or "Fecha operación")
  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(allRows.length, 20); i++) {
    const row = allRows[i] as unknown[];
    if (!row) continue;
    const first = String(row[0] ?? "").toLowerCase();
    if (first.includes("fecha")) {
      headerIdx = i;
      headers = row.map((c) => String(c ?? "").trim());
      break;
    }
  }

  if (headerIdx === -1) {
    // Fallback: try sheet_to_json with default headers
    const fallback = parseGenericFormat(sheet, filename);
    return buildResult(fallback);
  }

  const mappings = db.select().from(merchantMappings).all();
  const dataRows = allRows.slice(headerIdx + 1);

  // Map column indices
  const colMap = {
    date: findColIndex(headers, ["fecha operación", "fecha operacion", "fecha"]),
    hour: findColIndex(headers, ["hora"]),
    merchant: findColIndex(headers, ["nombre comercio", "comercio"]),
    concept: findColIndex(headers, ["concepto", "transaccion", "transacción", "descripcion", "descripción"]),
    amount: findColIndex(headers, ["importe"]),
  };

  const results: ParsedCardTransaction[] = [];

  for (const rawRow of dataRows) {
    const row = rawRow as unknown[];
    if (!row || !row[colMap.date]) continue;

    // Solo importar movimientos de tipo COMPRA
    const concept = String(row[colMap.concept] ?? "").trim().toUpperCase();
    if (concept && concept !== "COMPRA") continue;

    const dateStr = parseDateValue(row[colMap.date]);
    if (!dateStr) continue;

    const merchant = String(row[colMap.merchant] ?? "").trim();
    const description = concept;
    const amount = parseAmount(row[colMap.amount]);
    if (amount === 0) continue;

    const parsedDate = new Date(dateStr + "T00:00:00");
    const hour = row[colMap.hour] != null ? String(row[colMap.hour]).trim() : "";
    const uid = generateUID(dateStr, merchant, amount, hour || description);
    const suggestedCategoryId = matchMerchant(merchant, mappings);

    results.push({
      uid,
      date: dateStr,
      merchant,
      description,
      amount: Math.abs(amount),
      month: parsedDate.getMonth() + 1,
      year: parsedDate.getFullYear(),
      suggestedCategoryId,
      isDuplicate: false,
    });
  }

  return buildResult(results);
}

function buildResult(transactions: ParsedCardTransaction[]): ParseResult {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  // Billing month = most common month in transactions
  const monthCounts = new Map<string, number>();
  for (const t of transactions) {
    const key = `${t.year}-${t.month}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  let billingMonth = new Date().getMonth() + 1;
  let billingYear = new Date().getFullYear();
  let maxCount = 0;
  for (const [key, count] of monthCounts) {
    if (count > maxCount) {
      maxCount = count;
      const [y, m] = key.split("-").map(Number);
      billingYear = y;
      billingMonth = m;
    }
  }
  return { transactions, totalAmount: Math.round(totalAmount * 100) / 100, billingMonth, billingYear };
}

function parseGenericFormat(sheet: XLSX.Sheet, filename: string): ParsedCardTransaction[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const mappings = db.select().from(merchantMappings).all();

  return rows
    .map((row) => {
      const dateRaw = row["FECHA"] || row["Fecha"] || row["fecha"] || row["Fecha operación"] || "";
      const merchant = String(row["COMERCIO"] || row["Comercio"] || row["Nombre comercio"] || "").trim();
      const description = String(row["TRANSACCION"] || row["Concepto"] || row["CONCEPTO"] || "").trim();
      const amountRaw = row["IMPORTE"] || row["Importe"] || 0;

      const date = parseDateValue(dateRaw);
      if (!date) return null;

      const amount = Math.abs(parseAmount(amountRaw));
      if (amount === 0) return null;

      const parsedDate = new Date(date + "T00:00:00");
      const uid = generateUID(date, merchant, amount, description);
      const suggestedCategoryId = matchMerchant(merchant, mappings);

      return {
        uid,
        date,
        merchant,
        description,
        amount,
        month: parsedDate.getMonth() + 1,
        year: parsedDate.getFullYear(),
        suggestedCategoryId,
        isDuplicate: false,
      } as ParsedCardTransaction;
    })
    .filter((r): r is ParsedCardTransaction => r !== null);
}

function findColIndex(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h.toLowerCase() === candidate);
    if (idx !== -1) return idx;
  }
  // Partial match
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h.toLowerCase().includes(candidate));
    if (idx !== -1) return idx;
  }
  return 0;
}

function parseDateValue(value: unknown): string | null {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return null;
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }

  const str = String(value).trim();

  // dd/MM/yyyy
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
  }

  // yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  return null;
}

function parseAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Handle Spanish format: "-12,31" -> -12.31
    const cleaned = value.replace(/\s/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

function generateUID(date: string, merchant: string, amount: number, extra: string): string {
  const raw = `${date}|${merchant}|${amount}|${extra}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `${date}-${Math.abs(hash).toString(36)}`;
}

function matchMerchant(
  merchant: string,
  mappings: { merchantPattern: string; categoryId: number }[]
): number | null {
  const upperMerchant = merchant.toUpperCase();
  for (const mapping of mappings) {
    if (upperMerchant.includes(mapping.merchantPattern.toUpperCase())) {
      return mapping.categoryId;
    }
  }
  return null;
}
