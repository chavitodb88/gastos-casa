"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/shared/currency-input";
import { ArrowRight } from "lucide-react";

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

export interface TransactionFormData {
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
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TransactionFormData) => void;
  categories: Category[];
  accounts: Account[];
  initialData?: TransactionFormData;
}

const defaultFormData: TransactionFormData = {
  date: new Date().toISOString().split("T")[0],
  type: "EXPENSE",
  amount: 0,
  description: "",
  categoryId: null,
  accountId: null,
  toAccountId: null,
  isPaid: false,
  isFixed: false,
  notes: null,
};

export function TransactionForm({
  open,
  onOpenChange,
  onSave,
  categories,
  accounts,
  initialData,
}: TransactionFormProps) {
  const [form, setForm] = useState<TransactionFormData>(defaultFormData);

  useEffect(() => {
    if (open) {
      setForm(initialData ?? defaultFormData);
    }
  }, [open, initialData]);

  const isTransfer = form.type === "TRANSFER";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...form };
    if (isTransfer) {
      submitData.categoryId = null;
      submitData.isPaid = true;
    } else {
      submitData.toAccountId = null;
    }
    onSave(submitData);
  };

  const selectClass =
    "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar transacción" : "Nueva transacción"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                className={selectClass}
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as "INCOME" | "EXPENSE" | "TRANSFER",
                  })
                }
              >
                <option value="EXPENSE">Gasto</option>
                <option value="INCOME">Ingreso</option>
                <option value="TRANSFER">Transferencia</option>
              </select>
            </div>
          </div>

          {isTransfer ? (
            <div className="grid gap-2">
              <Label>De → A</Label>
              <div className="flex items-center gap-2">
                <select
                  className={selectClass}
                  value={form.accountId?.toString() ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      accountId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  required
                >
                  <option value="">Origen</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id.toString()}>
                      {acc.name}
                    </option>
                  ))}
                </select>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <select
                  className={selectClass}
                  value={form.toAccountId?.toString() ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      toAccountId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  required
                >
                  <option value="">Destino</option>
                  {accounts
                    .filter((a) => a.id !== form.accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id.toString()}>
                        {acc.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="account">Cuenta</Label>
              <select
                id="account"
                className={selectClass}
                value={form.accountId?.toString() ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accountId: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Sin cuenta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id.toString()}>
                    {acc.name} ({acc.bank})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="amount">Importe</Label>
              <CurrencyInput
                id="amount"
                value={form.amount}
                onChange={(val) => setForm({ ...form, amount: val })}
                required
              />
            </div>
            {!isTransfer && (
              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  className={selectClass}
                  value={form.categoryId?.toString() ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      categoryId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
              placeholder={isTransfer ? "Ej: Cajero, Apartar IVA..." : ""}
            />
          </div>

          {!isTransfer && (
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPaid}
                  onChange={(e) =>
                    setForm({ ...form, isPaid: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                Pagado / Cobrado
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFixed}
                  onChange={(e) =>
                    setForm({ ...form, isFixed: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                Fijo
              </label>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value || null,
                })
              }
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
