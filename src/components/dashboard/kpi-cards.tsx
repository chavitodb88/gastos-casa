"use client";

import { TrendingUp, TrendingDown, CreditCard, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface KpiCardsProps {
  totalIncome: number;
  paidIncome: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  cardExpenses: number;
  balance: number;
}

export function KpiCards({
  totalIncome,
  paidIncome,
  totalExpenses,
  paidExpenses,
  pendingExpenses,
  cardExpenses,
  balance,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-muted-foreground">
            Cobrados: {formatCurrency(paidIncome)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gastos
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-muted-foreground">
            Pagados: {formatCurrency(paidExpenses)} | Pendientes:{" "}
            {formatCurrency(pendingExpenses)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tarjeta
            </CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(cardExpenses)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
            <Wallet
              className={`h-4 w-4 ${balance >= 0 ? "text-green-500" : "text-red-500"}`}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
