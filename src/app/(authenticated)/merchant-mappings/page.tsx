"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

interface MerchantMapping {
  id: number;
  merchantPattern: string;
  categoryId: number;
  categoryName: string | null;
  categoryColor: string | null;
}

interface Category {
  id: number;
  name: string;
}

const emptyForm = {
  merchantPattern: "",
  categoryId: 0,
};

export default function MerchantMappingsPage() {
  const [mappings, setMappings] = useState<MerchantMapping[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [recategorizing, setRecategorizing] = useState(false);

  const fetchMappings = () => {
    fetch("/api/merchant-mappings")
      .then((res) => res.json())
      .then(setMappings);
  };

  useEffect(() => {
    fetchMappings();
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: MerchantMapping) => {
    setEditingId(m.id);
    setForm({
      merchantPattern: m.merchantPattern,
      categoryId: m.categoryId,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.categoryId) {
      toast.error("Selecciona una categoría");
      return;
    }

    setLoading(true);
    const url = editingId
      ? `/api/merchant-mappings/${editingId}`
      : "/api/merchant-mappings";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al guardar");
        return;
      }

      toast.success(editingId ? "Mapeo actualizado" : "Mapeo creado");
      setDialogOpen(false);
      fetchMappings();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este mapeo?")) return;

    try {
      const res = await fetch(`/api/merchant-mappings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Error al eliminar");
        return;
      }
      toast.success("Mapeo eliminado");
      fetchMappings();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleRecategorize = async () => {
    setRecategorizing(true);
    try {
      const res = await fetch("/api/merchant-mappings/recategorize", {
        method: "POST",
      });

      if (!res.ok) {
        toast.error("Error al recategorizar");
        return;
      }

      const data = await res.json();
      toast.success(`${data.recategorized} transacciones recategorizadas`);
    } catch {
      toast.error("Error al recategorizar");
    } finally {
      setRecategorizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mapeos de comercios</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRecategorize}
            disabled={recategorizing}
          >
            <RefreshCw
              className={`h-4 w-4 ${recategorizing ? "animate-spin" : ""}`}
            />
            Recategorizar
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo mapeo
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patrón comercio</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No hay mapeos de comercios
              </TableCell>
            </TableRow>
          ) : (
            mappings.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono">{m.merchantPattern}</TableCell>
                <TableCell>
                  {m.categoryName ? (
                    <Badge
                      variant="secondary"
                      style={
                        m.categoryColor
                          ? {
                              backgroundColor: m.categoryColor + "20",
                              color: m.categoryColor,
                            }
                          : undefined
                      }
                    >
                      {m.categoryName}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Sin categoría
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(m)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(m.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar mapeo" : "Nuevo mapeo"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Patrón de comercio</Label>
              <Input
                value={form.merchantPattern}
                onChange={(e) =>
                  setForm({ ...form, merchantPattern: e.target.value })
                }
                placeholder="MERCADONA, LIDL, etc."
              />
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select
                value={form.categoryId || undefined}
                onValueChange={(val) =>
                  setForm({ ...form, categoryId: Number(val) })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
