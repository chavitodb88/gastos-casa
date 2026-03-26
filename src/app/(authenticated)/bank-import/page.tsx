"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Upload, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface Account {
  id: number;
  name: string;
  bank: string;
  color: string | null;
}

interface PreviewRow {
  uid: string;
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  isAutoIgnored: boolean;
  ignoreReason?: string;
  isDuplicate: boolean;
  matchedTransactionId: number | null;
  matchedDescription: string | null;
}

interface ImportResult {
  imported: number;
  matched: number;
  duplicatesSkipped: number;
  autoIgnored: number;
}

type Step = "upload" | "preview" | "done";

export default function BankImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("none");
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [ignoredUids, setIgnoredUids] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then(setAccounts)
      .catch(console.error);
  }, []);

  const handleFile = async (selectedFile: File) => {
    if (selectedAccountId === "none") {
      toast.error("Selecciona una cuenta antes de importar");
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("accountId", selectedAccountId);

    try {
      const res = await fetch("/api/bank-import?action=preview", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al procesar el archivo");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setPreviewRows(data.rows);

      // Initialize ignored set with auto-ignored rows
      const autoIgnored = new Set<string>();
      for (const row of data.rows) {
        if (row.isAutoIgnored) {
          autoIgnored.add(row.uid);
        }
      }
      setIgnoredUids(autoIgnored);

      setStep("preview");
    } catch {
      toast.error("Error al procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const toggleIgnore = (uid: string) => {
    setIgnoredUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountId", selectedAccountId);

    try {
      const res = await fetch("/api/bank-import?action=confirm", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al importar");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResult(data);
      setStep("done");
      toast.success("Importación completada");
    } catch {
      toast.error("Error al importar");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setPreviewRows([]);
    setIgnoredUids(new Set());
    setResult(null);
  };

  const duplicateCount = previewRows.filter((r) => r.isDuplicate).length;
  const ignoredCount = previewRows.filter(
    (r) => ignoredUids.has(r.uid) && !r.isDuplicate
  ).length;
  const importableCount = previewRows.filter(
    (r) => !r.isDuplicate && !ignoredUids.has(r.uid)
  ).length;

  const selectedAccount = accounts.find(
    (a) => a.id.toString() === selectedAccountId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/transactions"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-transparent hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Importar extracto bancario</h1>
      </div>

      {step === "upload" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Cuenta destino</label>
                  <Select
                    value={selectedAccountId}
                    onValueChange={(val) =>
                      setSelectedAccountId(val ?? "none")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Selecciona una cuenta
                      </SelectItem>
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

                <div
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer ${
                    selectedAccountId === "none"
                      ? "border-muted-foreground/15 opacity-50 cursor-not-allowed"
                      : dragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (selectedAccountId !== "none") setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    if (selectedAccountId !== "none") handleDrop(e);
                    else e.preventDefault();
                  }}
                  onClick={() => {
                    if (selectedAccountId !== "none") {
                      inputRef.current?.click();
                    } else {
                      toast.error("Selecciona una cuenta primero");
                    }
                  }}
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {loading
                      ? "Procesando..."
                      : "Arrastra un archivo Excel o haz clic para seleccionar"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Formatos soportados: .xlsx, .xls
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "preview" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {selectedAccount && (
                <Badge variant="outline" className="gap-1.5">
                  {selectedAccount.color && (
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: selectedAccount.color }}
                    />
                  )}
                  {selectedAccount.name}
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">
                {previewRows.length} movimientos encontrados
              </p>
              {duplicateCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {duplicateCount} duplicados
                </Badge>
              )}
              {ignoredCount > 0 && (
                <Badge variant="secondary">
                  {ignoredCount} ignorados
                </Badge>
              )}
              <Badge className="bg-green-600 hover:bg-green-700">
                {importableCount} a importar
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Volver
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading || importableCount === 0}
              >
                {loading ? "Importando..." : "Confirmar importación"}
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Incluir</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row) => {
                const isIgnored = ignoredUids.has(row.uid);
                const isSkipped = row.isDuplicate || isIgnored;

                return (
                  <TableRow
                    key={row.uid}
                    className={isSkipped ? "opacity-40" : ""}
                  >
                    <TableCell>
                      {row.isDuplicate ? (
                        <Checkbox checked={false} disabled />
                      ) : (
                        <Checkbox
                          checked={!isIgnored}
                          onCheckedChange={() => toggleIgnore(row.uid)}
                        />
                      )}
                    </TableCell>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{row.description}</span>
                      {row.isAutoIgnored && row.ignoreReason && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {row.ignoreReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        row.type === "INCOME"
                          ? "text-green-600"
                          : row.type === "EXPENSE"
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      {row.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.type === "INCOME"
                            ? "default"
                            : row.type === "EXPENSE"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {row.type === "INCOME"
                          ? "Ingreso"
                          : row.type === "EXPENSE"
                            ? "Gasto"
                            : "Transferencia"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.isDuplicate ? (
                        <Badge variant="destructive">Duplicado</Badge>
                      ) : isIgnored ? (
                        <Badge variant="secondary">Ignorado</Badge>
                      ) : row.matchedTransactionId ? (
                        <div>
                          <Badge className="bg-blue-600">Coincide</Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            → {row.matchedDescription} (se marcará como pagado)
                          </p>
                        </div>
                      ) : (
                        <Badge className="bg-green-600">Nuevo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}

      {step === "done" && result && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">Importación completada</h2>
              {selectedAccount && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  Cuenta:
                  {selectedAccount.color && (
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: selectedAccount.color }}
                    />
                  )}
                  <span className="font-medium text-foreground">
                    {selectedAccount.name}
                  </span>
                </p>
              )}
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {result.imported}
                  </p>
                  <p className="text-sm text-muted-foreground">Nuevos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {result.matched}
                  </p>
                  <p className="text-sm text-muted-foreground">Marcados pagados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {result.duplicatesSkipped}
                  </p>
                  <p className="text-sm text-muted-foreground">Duplicados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {result.autoIgnored}
                  </p>
                  <p className="text-sm text-muted-foreground">Ignorados</p>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={handleReset}>
                  Importar otro archivo
                </Button>
                <Link
                  href="/transactions"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  Ver transacciones
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
