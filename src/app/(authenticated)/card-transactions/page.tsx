"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FileSpreadsheet, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { formatCurrency, formatDate } from "@/lib/format";

interface CardTransaction {
  id: number;
  date: string;
  merchant: string;
  description: string | null;
  amount: number;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
}

interface Category {
  id: number;
  name: string;
}

export default function CardTransactionsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [merchantSearch, setMerchantSearch] = useState("");
  const [list, setList] = useState<CardTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("month", String(month));
    params.set("year", String(year));
    if (categoryId) params.set("categoryId", String(categoryId));
    if (merchantSearch) params.set("merchant", merchantSearch);

    fetch(`/api/card-transactions?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setList(data);
        setLoading(false);
      });
  }, [month, year, categoryId, merchantSearch]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transacciones de tarjeta</h1>
        <Link href="/card-transactions/import" className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium">
          <FileSpreadsheet className="h-4 w-4" />
          Importar Excel
        </Link>
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

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar comercio..."
            value={merchantSearch}
            onChange={(e) => setMerchantSearch(e.target.value)}
            className="pl-8 w-[200px]"
          />
        </div>

        <Select
          value={categoryId ?? undefined}
          onValueChange={(val) => setCategoryId(val ? Number(val) : null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={0}>Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {list.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <span className="font-medium">Total:</span>
            <span className="font-semibold text-red-600">{formatCurrency(list.reduce((s, t) => s + t.amount, 0))}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <span className="text-muted-foreground">{list.length} movimientos</span>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Comercio</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead>Categoría</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Cargando...
              </TableCell>
            </TableRow>
          ) : list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay transacciones para este periodo
              </TableCell>
            </TableRow>
          ) : (
            list.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{formatDate(tx.date)}</TableCell>
                <TableCell className="font-medium">{tx.merchant}</TableCell>
                <TableCell className="text-muted-foreground">
                  {tx.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell>
                  {tx.categoryName ? (
                    <Badge
                      variant="secondary"
                      style={
                        tx.categoryColor
                          ? { backgroundColor: tx.categoryColor + "20", color: tx.categoryColor }
                          : undefined
                      }
                    >
                      {tx.categoryName}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Sin categoría</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
