"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface Payment {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: string;
}

interface UpcomingPaymentsProps {
  payments: Payment[];
}

export function UpcomingPayments({ payments }: UpcomingPaymentsProps) {
  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos 7 días</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay pagos próximos</p>
        ) : (
          <ul className="space-y-3">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {formatShortDate(payment.date)}
                  </span>
                  <span className="text-sm font-medium">{payment.description}</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    payment.type === "EXPENSE" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {payment.type === "EXPENSE" ? "-" : "+"}
                  {formatCurrency(payment.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
