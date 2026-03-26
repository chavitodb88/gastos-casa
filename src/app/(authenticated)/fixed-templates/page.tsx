"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface FixedTemplate {
  id: number;
  dayOfMonth: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  categoryId: number | null;
  categoryName: string | null;
  accountId: number | null;
  accountName: string | null;
  accountColor: string | null;
  isActive: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface Account {
  id: number;
  name: string;
  bank: string;
  color: string | null;
}

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

const emptyForm = {
  dayOfMonth: 1,
  type: "EXPENSE" as "INCOME" | "EXPENSE" | "TRANSFER",
  amount: 0,
  description: "",
  categoryId: null as number | null,
  accountId: null as number | null,
  isActive: true,
};

export default function FixedTemplatesPage() {
  const [templates, setTemplates] = useState<FixedTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());

  const isTransfer = form.type === "TRANSFER";

  const fetchTemplates = () => {
    fetch("/api/fixed-templates")
      .then((res) => res.json())
      .then(setTemplates);
  };

  useEffect(() => {
    fetchTemplates();
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: FixedTemplate) => {
    setEditingId(t.id);
    setForm({
      dayOfMonth: t.dayOfMonth,
      type: t.type,
      amount: t.amount,
      description: t.description,
      categoryId: t.categoryId,
      accountId: t.accountId,
      isActive: t.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const url = editingId
      ? `/api/fixed-templates/${editingId}`
      : "/api/fixed-templates";
    const method = editingId ? "PUT" : "POST";

    const submitData = { ...form };
    if (isTransfer) {
      submitData.categoryId = null;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al guardar");
        return;
      }

      toast.success(editingId ? "Plantilla actualizada" : "Plantilla creada");
      setDialogOpen(false);
      fetchTemplates();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;

    try {
      const res = await fetch(`/api/fixed-templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Error al eliminar");
        return;
      }
      toast.success("Plantilla eliminada");
      fetchTemplates();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch(`/api/fixed-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) {
        toast.error("Error al actualizar");
        return;
      }

      fetchTemplates();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fixed-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: genMonth, year: genYear }),
      });

      if (!res.ok) {
        toast.error("Error al generar transacciones");
        return;
      }

      const data = await res.json();
      toast.success(`${data.created} transacciones creadas, ${data.skipped} omitidas`);
      setGenerateOpen(false);
    } catch {
      toast.error("Error al generar transacciones");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plantillas fijas</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGenerateOpen(true)}>
            <CalendarClock className="h-4 w-4" />
            Generar mes
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva plantilla
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Día</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No hay plantillas fijas
              </TableCell>
            </TableRow>
          ) : (
            templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.dayOfMonth}</TableCell>
                <TableCell className="font-medium">{t.description}</TableCell>
                <TableCell>
                  {t.accountName ? (
                    <span className="flex items-center gap-1.5">
                      {t.accountColor && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.accountColor }}
                        />
                      )}
                      <span className="text-sm">{t.accountName}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={typeBadgeVariant[t.type] ?? "secondary"}>
                    {typeLabel[t.type] ?? t.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(t.amount)}
                </TableCell>
                <TableCell>
                  {t.categoryName || (
                    <span className="text-muted-foreground text-xs">Sin categoría</span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={t.isActive}
                    onCheckedChange={(checked) =>
                      handleToggleActive(t.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar plantilla" : "Nueva plantilla"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Día del mes</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={form.dayOfMonth}
                onChange={(e) =>
                  setForm({ ...form, dayOfMonth: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    type: (val ?? "EXPENSE") as "INCOME" | "EXPENSE" | "TRANSFER",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Gasto</SelectItem>
                  <SelectItem value="INCOME">Ingreso</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cuenta</Label>
              <Select
                value={form.accountId?.toString() ?? "none"}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    accountId: val === "none" || !val ? null : Number(val),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cuenta</SelectItem>
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
                        <span className="text-muted-foreground text-xs">
                          ({acc.bank})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Importe</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount || ""}
                onChange={(e) =>
                  setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            {!isTransfer && (
              <div className="grid gap-2">
                <Label>Categoría</Label>
                <Select
                  value={form.categoryId ?? undefined}
                  onValueChange={(val) =>
                    setForm({
                      ...form,
                      categoryId: val ? Number(val) : null,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={0}>Sin categoría</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate month dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Generar transacciones del mes</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Mes</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={genMonth}
                onChange={(e) => setGenMonth(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Año</Label>
              <Input
                type="number"
                min={2020}
                max={2099}
                value={genYear}
                onChange={(e) => setGenYear(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generando..." : "Generar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
