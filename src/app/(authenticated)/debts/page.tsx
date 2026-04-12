"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { DebtForm, type DebtFormData } from "@/components/debts/debt-form";
import {
  SettleDialog,
  type SettleFormData,
} from "@/components/debts/settle-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Debt {
  id: number;
  type: "RECEIVABLE" | "PAYABLE";
  personName: string;
  description: string;
  amount: number;
  date: string;
  dueDate: string | null;
  status: "PENDING" | "SETTLED";
  settledAt: string | null;
  transactionId: number | null;
  notes: string | null;
  accountName: string | null;
  accountColor: string | null;
  categoryName: string | null;
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
  status: string;
  personName: string;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [personNames, setPersonNames] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settling, setSettling] = useState<Debt | null>(null);
  const [filters, setFilters] = useState<Filters>({
    type: "all",
    status: "PENDING",
    personName: "all",
  });

  const fetchDebts = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.type !== "all") params.set("type", filters.type);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.personName !== "all")
      params.set("personName", filters.personName);

    const res = await fetch(`/api/debts?${params}`);
    if (res.ok) setDebts(await res.json());
  }, [filters]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/debts?persons=true").then((r) => r.json()),
    ])
      .then(([cats, accs, persons]) => {
        setCategories(cats);
        setAccounts(accs);
        setPersonNames(persons);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const refreshPersonNames = async () => {
    const res = await fetch("/api/debts?persons=true");
    if (res.ok) setPersonNames(await res.json());
  };

  const handleSave = async (data: DebtFormData) => {
    const url = editing ? `/api/debts/${editing.id}` : "/api/debts";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setFormOpen(false);
      setEditing(null);
      fetchDebts();
      refreshPersonNames();
    }
  };

  const handleSettle = async (data: SettleFormData) => {
    if (!settling) return;

    const res = await fetch(`/api/debts/${settling.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setSettleOpen(false);
      setSettling(null);
      fetchDebts();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta deuda?")) return;
    const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchDebts();
      refreshPersonNames();
    }
  };

  const handleEdit = (debt: Debt) => {
    setEditing(debt);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSettleClick = (debt: Debt) => {
    setSettling(debt);
    setSettleOpen(true);
  };

  const totals = debts.reduce(
    (acc, d) => {
      if (d.status === "PENDING") {
        if (d.type === "RECEIVABLE") acc.receivable += d.amount;
        else acc.payable += d.amount;
      }
      return acc;
    },
    { receivable: 0, payable: 0 }
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cobros y Pagos</h1>
        <Button onClick={handleNew} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
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
            <SelectItem value="RECEIVABLE">Me deben</SelectItem>
            <SelectItem value="PAYABLE">Debo yo</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, status: val ?? "all" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="SETTLED">Liquidado</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.personName}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, personName: val ?? "all" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Persona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {personNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(totals.receivable > 0 || totals.payable > 0) && (
        <div className="flex flex-wrap gap-4 text-sm">
          {totals.receivable > 0 && (
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
              <span className="text-green-600 font-medium">Te deben:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(totals.receivable)}
              </span>
            </div>
          )}
          {totals.payable > 0 && (
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
              <span className="text-red-600 font-medium">Debes:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(totals.payable)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <span className="font-medium">Neto:</span>
            <span
              className={`font-semibold ${
                totals.receivable - totals.payable >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(totals.receivable - totals.payable)}
            </span>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Persona</TableHead>
            <TableHead>Descripcion</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {debts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground py-8"
              >
                No hay cobros ni pagos registrados
              </TableCell>
            </TableRow>
          ) : (
            debts.map((debt) => (
              <TableRow key={debt.id}>
                <TableCell>{formatDate(debt.date)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      debt.type === "RECEIVABLE" ? "default" : "destructive"
                    }
                  >
                    {debt.type === "RECEIVABLE" ? "Me deben" : "Debo yo"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {debt.personName}
                </TableCell>
                <TableCell>
                  {debt.description}
                  {debt.dueDate && (
                    <span className="block text-xs text-muted-foreground">
                      Vence: {formatDate(debt.dueDate)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(debt.amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      debt.status === "PENDING" ? "secondary" : "outline"
                    }
                  >
                    {debt.status === "PENDING" ? "Pendiente" : "Liquidado"}
                  </Badge>
                  {debt.settledAt && (
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(debt.settledAt)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {debt.accountName ? (
                    <span className="flex items-center gap-1.5">
                      {debt.accountColor && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: debt.accountColor }}
                        />
                      )}
                      <span className="text-sm">{debt.accountName}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {debt.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title={
                          debt.type === "RECEIVABLE" ? "Cobrar" : "Pagar"
                        }
                        onClick={() => handleSettleClick(debt)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {debt.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(debt)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(debt.id)}
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

      <DebtForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSave={handleSave}
        personNames={personNames}
        initialData={
          editing
            ? {
                type: editing.type,
                personName: editing.personName,
                description: editing.description,
                amount: editing.amount,
                date: editing.date,
                dueDate: editing.dueDate,
                notes: editing.notes,
              }
            : undefined
        }
      />

      {settling && (
        <SettleDialog
          open={settleOpen}
          onOpenChange={(open) => {
            setSettleOpen(open);
            if (!open) setSettling(null);
          }}
          onSettle={handleSettle}
          accounts={accounts}
          categories={categories}
          debtType={settling.type}
          personName={settling.personName}
          amount={settling.amount}
        />
      )}
    </div>
  );
}
