"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: number;
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  isPaid: boolean;
  notes: string | null;
  isFixed: boolean;
  categoryId: number | null;
  accountId: number | null;
  toAccountId?: number | null;
  categoryName?: string;
  accountName?: string | null;
  accountColor?: string | null;
  source: "MANUAL" | "CARD_IMPORT" | "AUTO_FIXED" | "BANK_IMPORT";
}

interface Category {
  id: number;
  name: string;
  color: string | null;
}

interface Account {
  id: number;
  name: string;
  bank: string;
  color: string | null;
}

interface Filters {
  type: string;
  categoryId: string;
  accountId: string;
  isPaid: string;
  isFixed: string;
}

const now = new Date();

const typeLabel: Record<string, string> = {
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  TRANSFER: "Transferencia",
};

const typeBadgeVariant: Record<string, "default" | "destructive" | "secondary"> = {
  INCOME: "default",
  EXPENSE: "destructive",
  TRANSFER: "secondary",
};

export default function TransactionsPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cardTotal, setCardTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<Filters>({
    type: "all",
    categoryId: "all",
    accountId: "all",
    isPaid: "all",
    isFixed: "all",
  });

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams({
      month: month.toString(),
      year: year.toString(),
    });

    if (filters.type !== "all") params.set("type", filters.type);
    if (filters.categoryId !== "all")
      params.set("categoryId", filters.categoryId);
    if (filters.accountId !== "all")
      params.set("accountId", filters.accountId);
    if (filters.isPaid !== "all") params.set("isPaid", filters.isPaid);
    if (filters.isFixed !== "all") params.set("isFixed", filters.isFixed);

    const [txRes, cardRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch(`/api/card-transactions?month=${month}&year=${year}`),
    ]);
    if (txRes.ok) setTransactions(await txRes.json());
    if (cardRes.ok) {
      const cardData = await cardRes.json();
      setCardTotal(cardData.reduce((s: number, c: { amount: number }) => s + c.amount, 0));
    }
  }, [month, year, filters]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((res) => res.json()),
      fetch("/api/accounts").then((res) => res.json()),
    ])
      .then(([cats, accs]) => {
        setCategories(cats);
        setAccounts(accs);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSave = async (data: {
    date: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amount: number;
    description: string;
    categoryId: number | null;
    accountId: number | null;
    toAccountId: number | null;
    isPaid: boolean;
    isFixed: boolean;
    notes: string | null;
  }) => {
    const url = editing
      ? `/api/transactions/${editing.id}`
      : "/api/transactions";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setDialogOpen(false);
      setEditing(null);
      fetchTransactions();
    }
  };

  const handleTogglePaid = async (id: number) => {
    const res = await fetch(`/api/transactions/${id}`, { method: "PATCH" });
    if (res.ok) fetchTransactions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta transacción?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) fetchTransactions();
  };

  const handleEdit = (tx: Transaction) => {
    setEditing(tx);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const sourceLabel: Record<string, string> = {
    MANUAL: "Manual",
    CARD_IMPORT: "Tarjeta",
    AUTO_FIXED: "Fijo",
    BANK_IMPORT: "Banco",
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transacciones</h1>
        <Button onClick={handleNew} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <MonthYearPicker
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />

        <Select
          value={filters.type}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, type: val ?? "all" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="INCOME">Ingresos</SelectItem>
            <SelectItem value="EXPENSE">Gastos</SelectItem>
            <SelectItem value="TRANSFER">Transferencias</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.accountId}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, accountId: val ?? "all" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuentas</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id.toString()}>
                <span className="flex items-center gap-2">
                  {acc.color && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: acc.color }}
                    />
                  )}
                  {acc.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, categoryId: val ?? "all" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.isPaid}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, isPaid: val ?? "all" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Pagado</SelectItem>
            <SelectItem value="false">Pendiente</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.isFixed}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, isFixed: val ?? "all" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo gasto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Fijo</SelectItem>
            <SelectItem value="false">Variable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {transactions.length > 0 && (() => {
        const totals = transactions.reduce(
          (acc, tx) => {
            // Excluir CARD_IMPORT de gastos (se cuentan aparte en tarjeta)
            if (tx.type === "INCOME") acc.income += tx.amount;
            else if (tx.type === "EXPENSE" && tx.source !== "CARD_IMPORT") acc.expense += tx.amount;
            else if (tx.source === "CARD_IMPORT") acc.card += tx.amount;
            return acc;
          },
          { income: 0, expense: 0, card: 0 }
        );
        const totalGastos = totals.expense + cardTotal;
        const balance = totals.income - totalGastos;
        return (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
              <span className="text-green-600 font-medium">Ingresos:</span>
              <span className="font-semibold text-green-600">{formatCurrency(totals.income)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
              <span className="text-red-600 font-medium">Gastos:</span>
              <span className="font-semibold text-red-600">{formatCurrency(totals.expense)}</span>
            </div>
            {cardTotal > 0 && (
              <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
                <span className="text-red-600 font-medium">Tarjeta:</span>
                <span className="font-semibold text-red-600">{formatCurrency(cardTotal)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
              <span className="font-medium">Balance:</span>
              <span className={`font-semibold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(balance)}
              </span>
            </div>
            <p className="w-full text-xs text-muted-foreground mt-1">Incluye pagados y pendientes. Los saldos de las cuentas solo reflejan lo pagado.</p>
          </div>
        );
      })()}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead>Pagado</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                No hay transacciones para este periodo
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{formatDate(tx.date)}</TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell>
                  {tx.accountName ? (
                    <span className="flex items-center gap-1.5">
                      {tx.accountColor && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tx.accountColor }}
                        />
                      )}
                      <span className="text-sm">{tx.accountName}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell>
                  {tx.categoryName ? (
                    <Badge variant="secondary">{tx.categoryName}</Badge>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={typeBadgeVariant[tx.type] ?? "secondary"}>
                    {typeLabel[tx.type] ?? tx.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell>
                  {tx.type === "TRANSFER" ? (
                    <Switch size="sm" checked={true} disabled />
                  ) : (
                    <Switch
                      size="sm"
                      checked={tx.isPaid}
                      onCheckedChange={() => handleTogglePaid(tx.id)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {sourceLabel[tx.source] ?? tx.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(tx)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tx.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TransactionForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSave={handleSave}
        categories={categories}
        accounts={accounts}
        initialData={
          editing
            ? {
                date: editing.date,
                type: editing.type,
                amount: editing.amount,
                description: editing.description,
                categoryId: editing.categoryId,
                accountId: editing.accountId,
                isPaid: editing.isPaid,
                isFixed: editing.isFixed,
                notes: editing.notes,
                toAccountId: editing.toAccountId ?? null,
              }
            : undefined
        }
      />
    </div>
  );
}
