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

export interface DebtFormData {
  type: "RECEIVABLE" | "PAYABLE";
  personName: string;
  description: string;
  amount: number;
  date: string;
  dueDate: string | null;
  notes: string | null;
}

interface DebtFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: DebtFormData) => void;
  personNames: string[];
  initialData?: DebtFormData;
}

const defaultFormData: DebtFormData = {
  type: "RECEIVABLE",
  personName: "",
  description: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  dueDate: null,
  notes: null,
};

export function DebtForm({
  open,
  onOpenChange,
  onSave,
  personNames,
  initialData,
}: DebtFormProps) {
  const [form, setForm] = useState<DebtFormData>(defaultFormData);

  useEffect(() => {
    if (open) {
      setForm(initialData ?? defaultFormData);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const selectClass =
    "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar" : "Nuevo cobro/pago"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="debt-type">Tipo</Label>
              <select
                id="debt-type"
                className={selectClass}
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as "RECEIVABLE" | "PAYABLE",
                  })
                }
              >
                <option value="RECEIVABLE">Me deben</option>
                <option value="PAYABLE">Debo yo</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debt-date">Fecha</Label>
              <Input
                id="debt-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="debt-person">Persona</Label>
            <Input
              id="debt-person"
              list="person-names"
              value={form.personName}
              onChange={(e) => setForm({ ...form, personName: e.target.value })}
              placeholder="Nombre de la persona"
              required
            />
            <datalist id="person-names">
              {personNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="debt-amount">Importe</Label>
              <CurrencyInput
                id="debt-amount"
                value={form.amount}
                onChange={(val) => setForm({ ...form, amount: val })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debt-due-date">Fecha limite (opcional)</Label>
              <Input
                id="debt-due-date"
                type="date"
                value={form.dueDate ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dueDate: e.target.value || null,
                  })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="debt-description">Descripcion</Label>
            <Input
              id="debt-description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Concepto del cobro/pago"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="debt-notes">Notas</Label>
            <Textarea
              id="debt-notes"
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
