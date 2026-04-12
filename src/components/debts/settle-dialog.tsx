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

interface Account {
  id: number;
  name: string;
  bank: string;
  color: string | null;
}

interface Category {
  id: number;
  name: string;
  color: string | null;
}

export interface SettleFormData {
  accountId: number;
  categoryId: number | null;
  date: string;
}

interface SettleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettle: (data: SettleFormData) => void;
  accounts: Account[];
  categories: Category[];
  debtType: "RECEIVABLE" | "PAYABLE";
  personName: string;
  amount: number;
}

export function SettleDialog({
  open,
  onOpenChange,
  onSettle,
  accounts,
  categories,
  debtType,
  personName,
  amount,
}: SettleDialogProps) {
  const [form, setForm] = useState<SettleFormData>({
    accountId: 0,
    categoryId: null,
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (open) {
      setForm({
        accountId: 0,
        categoryId: null,
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountId) return;
    onSettle(form);
  };

  const selectClass =
    "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  const title = debtType === "RECEIVABLE" ? "Cobrar" : "Pagar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title} deuda</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {debtType === "RECEIVABLE"
            ? `Registrar cobro de ${amount.toFixed(2)} EUR de ${personName}`
            : `Registrar pago de ${amount.toFixed(2)} EUR a ${personName}`}
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="settle-account">Cuenta</Label>
            <select
              id="settle-account"
              className={selectClass}
              value={form.accountId || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  accountId: Number(e.target.value),
                })
              }
              required
            >
              <option value="">Seleccionar cuenta</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id.toString()}>
                  {acc.name} ({acc.bank})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settle-category">Categoria</Label>
            <select
              id="settle-category"
              className={selectClass}
              value={form.categoryId?.toString() ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  categoryId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Sin categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settle-date">Fecha del cobro/pago</Label>
            <Input
              id="settle-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
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
            <Button type="submit">
              {debtType === "RECEIVABLE" ? "Cobrar" : "Pagar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
