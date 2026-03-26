import * as XLSX from "xlsx";

export interface ParsedBankTransaction {
  uid: string;
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  isAutoIgnored: boolean;
  ignoreReason?: string;
}

interface AutoIgnoreRule {
  test: (description: string) => boolean;
  reason: string;
}

const AUTO_IGNORE_RULES: AutoIgnoreRule[] = [
  {
    test: (desc) => desc.includes("REC.MCARD"),
    reason: "Recibo de tarjeta (ya contado en movimientos de tarjeta)",
  },
  {
    test: (desc) =>
      desc.includes("TRANSF. INMEDIATA") && desc.includes("JAVIER DELGADO"),
    reason: "Transferencia entre cuentas propias",
  },
];

export function parseBankExcelBuffer(
  buffer: Buffer,
  filename: string
): ParsedBankTransaction[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  // Find the header row (contains "Fecha" and "Concepto")
  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(allRows.length, 20); i++) {
    const row = allRows[i] as unknown[];
    if (!row) continue;
    const rowStr = row.map((c) => String(c ?? "").toLowerCase());
    const hasFecha = rowStr.some((s) => s.includes("fecha"));
    const hasConcepto = rowStr.some((s) => s.includes("concepto"));
    if (hasFecha && hasConcepto) {
      headerIdx = i;
      headers = row.map((c) => String(c ?? "").trim());
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error(
      "No se encontró la fila de cabeceras. El archivo debe contener columnas 'Fecha' y 'Concepto'."
    );
  }

  const dataRows = allRows.slice(headerIdx + 1);

  // Map column indices
  const colMap = {
    dateOp: findColIndex(headers, [
      "fecha de operación",
      "fecha de operacion",
      "fecha operación",
      "fecha operacion",
      "fecha",
    ]),
    dateValue: findColIndex(headers, ["fecha valor"]),
    concept: findColIndex(headers, ["concepto"]),
    amount: findColIndex(headers, ["importe"]),
  };

  const results: ParsedBankTransaction[] = [];

  for (const rawRow of dataRows) {
    const row = rawRow as unknown[];
    if (!row || row.length === 0) continue;

    const dateRaw = row[colMap.dateOp];
    const dateStr = parseDateValue(dateRaw);
    if (!dateStr) continue;

    const description = String(row[colMap.concept] ?? "").trim();
    if (!description) continue;

    const amount = parseAmount(row[colMap.amount]);
    if (amount === 0) continue;

    const type = amount > 0 ? "INCOME" : "EXPENSE";
    const absAmount = Math.abs(amount);

    const uid = generateUID(dateStr, description, amount);

    // Check auto-ignore rules
    const upperDesc = description.toUpperCase();
    let isAutoIgnored = false;
    let ignoreReason: string | undefined;

    for (const rule of AUTO_IGNORE_RULES) {
      if (rule.test(upperDesc)) {
        isAutoIgnored = true;
        ignoreReason = rule.reason;
        break;
      }
    }

    results.push({
      uid,
      date: dateStr,
      description,
      amount: absAmount,
      type,
      isAutoIgnored,
      ignoreReason,
    });
  }

  return results;
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

function generateUID(date: string, description: string, amount: number): string {
  const raw = `BANK|${date}|${description}|${amount}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `bank-${date}-${Math.abs(hash).toString(36)}`;
}
