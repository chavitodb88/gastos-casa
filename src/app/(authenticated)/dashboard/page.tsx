"use client";

import { useState, useEffect } from "react";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, AlertTriangle, Info, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface AccountBalance {
  id: number;
  name: string;
  bank: string;
  color: string | null;
  balance: number;
}

interface DashboardData {
  totalIncome: number;
  paidIncome: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  cardExpenses: number;
  balance: number;
  categoryBreakdown: { category: string; total: number; color: string }[];
  upcomingPayments: {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: string;
  }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
  accountBalances: AccountBalance[];
  totalBalance: number;
  reminders: { type: "info" | "warning" | "action"; message: string }[];
}

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [excludedAccounts, setExcludedAccounts] = useState<Set<number>>(new Set());
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?month=${month}&year=${year}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* Account balances - solo mes actual */}
          {isCurrentMonth && data.accountBalances && (() => {
            // Filter out "Unicaja Tarjeta" (no tiene saldo propio)
            const visibleAccounts = data.accountBalances.filter(a => a.name !== "Unicaja Tarjeta");
            const filteredTotal = visibleAccounts
              .filter(a => !excludedAccounts.has(a.id))
              .reduce((s, a) => s + a.balance, 0);

            const toggleAccount = (id: number) => {
              setExcludedAccounts(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            };

            return (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wallet className="h-4 w-4" />
                      Mis cuentas
                    </CardTitle>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total disponible</p>
                      <p className={`text-xl font-bold ${filteredTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(filteredTotal)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {visibleAccounts.map((acc) => {
                      const excluded = excludedAccounts.has(acc.id);
                      return (
                        <button
                          key={acc.id}
                          onClick={() => toggleAccount(acc.id)}
                          className={`rounded-lg border p-3 space-y-1 text-left transition-all ${
                            excluded ? "opacity-40 border-dashed" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: acc.color ?? "#94a3b8" }}
                            />
                            <p className="text-xs text-muted-foreground truncate">{acc.name}</p>
                          </div>
                          <p className={`text-lg font-semibold ${acc.balance >= 0 ? "" : "text-red-600"}`}>
                            {formatCurrency(acc.balance)}
                          </p>
                          {excluded && (
                            <p className="text-[10px] text-muted-foreground">excluida del total</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Recordatorios - solo mes actual */}
          {isCurrentMonth && data.reminders && data.reminders.length > 0 && (
            <div className="space-y-2">
              {data.reminders.map((reminder, i) => {
                const styles = {
                  action: { bg: "bg-blue-50 border-blue-200", icon: <Zap className="h-4 w-4 text-blue-600" />, text: "text-blue-800" },
                  warning: { bg: "bg-amber-50 border-amber-200", icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, text: "text-amber-800" },
                  info: { bg: "bg-gray-50 border-gray-200", icon: <Info className="h-4 w-4 text-gray-500" />, text: "text-gray-700" },
                }[reminder.type];
                return (
                  <div key={i} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${styles.bg}`}>
                    {styles.icon}
                    <p className={`text-sm ${styles.text}`}>{reminder.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          <KpiCards
            totalIncome={data.totalIncome}
            paidIncome={data.paidIncome}
            totalExpenses={data.totalExpenses}
            paidExpenses={data.paidExpenses}
            pendingExpenses={data.pendingExpenses}
            cardExpenses={data.cardExpenses}
            balance={data.balance}
          />

          {isCurrentMonth && <UpcomingPayments payments={data.upcomingPayments} />}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CategoryBreakdown data={data.categoryBreakdown} />
            <MonthlyTrend data={data.monthlyTrend} />
          </div>
        </>
      ) : (
        <p className="text-center text-muted-foreground">
          Error al cargar los datos del dashboard
        </p>
      )}
    </div>
  );
}
