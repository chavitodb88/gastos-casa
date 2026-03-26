"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Upload, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

interface PreviewRow {
  uid: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  suggestedCategoryId: number | null;
  isDuplicate: boolean;
}

interface ImportResult {
  imported: number;
  duplicatesSkipped: number;
}

type Step = "upload" | "preview" | "done";

export default function ImportCardTransactionsPage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/card-transactions/import?action=preview", {
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
      setStep("preview");
    } catch {
      toast.error("Error al procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/card-transactions/import?action=confirm", {
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

  const duplicateCount = previewRows.filter((r) => r.isDuplicate).length;
  const newCount = previewRows.length - duplicateCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/card-transactions" className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-transparent hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Importar transacciones de tarjeta</h1>
      </div>

      {step === "upload" && (
        <Card>
          <CardContent>
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {loading ? "Procesando..." : "Arrastra un archivo Excel o haz clic para seleccionar"}
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
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {previewRows.length} transacciones encontradas
              </p>
              {duplicateCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3" />
                  {duplicateCount} duplicadas
                </Badge>
              )}
              <Badge variant="secondary">{newCount} nuevas</Badge>
            </div>
            <Button onClick={handleConfirm} disabled={loading || newCount === 0}>
              {loading ? "Importando..." : "Confirmar importación"}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Comercio</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row) => (
                <TableRow
                  key={row.uid}
                  className={row.isDuplicate ? "opacity-50" : ""}
                >
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell className="font-medium">{row.merchant}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell>
                    {row.isDuplicate ? (
                      <Badge variant="destructive">Duplicada</Badge>
                    ) : (
                      <Badge variant="secondary">Nueva</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold">{result.imported}</p>
                  <p className="text-sm text-muted-foreground">Importadas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{result.duplicatesSkipped}</p>
                  <p className="text-sm text-muted-foreground">Duplicadas omitidas</p>
                </div>
              </div>
              <Link href="/card-transactions" className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-input bg-transparent hover:bg-accent text-sm font-medium">
                Volver a transacciones
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
