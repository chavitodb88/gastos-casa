import { format } from "date-fns";
import { es } from "date-fns/locale";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Try yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00");
  }

  // Try dd/MM/yyyy
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(
      Number(ddmmyyyy[3]),
      Number(ddmmyyyy[2]) - 1,
      Number(ddmmyyyy[1])
    );
  }

  // Fallback: let Date parse it
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

export function formatDate(dateStr: string): string {
  return format(parseDate(dateStr), "dd/MM/yyyy", { locale: es });
}

export function formatDateLong(dateStr: string): string {
  return format(parseDate(dateStr), "d 'de' MMMM yyyy", { locale: es });
}

export function formatMonth(month: number, year: number): string {
  const date = new Date(year, month - 1);
  return format(date, "MMMM yyyy", { locale: es });
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
