import { db } from "@/db";
import { transactions, cardTransactions, categories, accounts, importBatches } from "@/db/schema";
import { eq, and, ne, sql, like, gt, gte, lte, sum, desc } from "drizzle-orm";

export function getDashboardData(month: number, year: number) {
  const datePrefix = `${year}-${String(month).padStart(2, "0")}%`;

  // Income totals
  const incomeResult = db
    .select({
      total: sum(transactions.amount),
      paid: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.isPaid} = 1 THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        like(transactions.date, datePrefix),
        eq(transactions.type, "INCOME")
      )
    )
    .get();

  const totalIncome = Number(incomeResult?.total ?? 0);
  const paidIncome = Number(incomeResult?.paid ?? 0);

  // Expense totals (exclude CARD_IMPORT, those are counted separately from cardTransactions table)
  const expenseResult = db
    .select({
      total: sum(transactions.amount),
      paid: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.isPaid} = 1 THEN ${transactions.amount} ELSE 0 END), 0)`,
      pending: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.isPaid} = 0 THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        like(transactions.date, datePrefix),
        eq(transactions.type, "EXPENSE"),
        ne(transactions.source, "CARD_IMPORT")
      )
    )
    .get();

  const totalExpenses = Number(expenseResult?.total ?? 0);
  const paidExpenses = Number(expenseResult?.paid ?? 0);
  const pendingExpenses = Number(expenseResult?.pending ?? 0);

  // Card expenses
  const cardResult = db
    .select({
      total: sum(cardTransactions.amount),
    })
    .from(cardTransactions)
    .where(
      and(
        eq(cardTransactions.month, month),
        eq(cardTransactions.year, year)
      )
    )
    .get();

  const cardExpenses = Number(cardResult?.total ?? 0);

  // Balance
  const balance = totalIncome - totalExpenses - cardExpenses;

  // Category breakdown: transactions (exclude CARD_IMPORT and TRANSFER)
  const txByCategory = db
    .select({
      category: categories.name,
      total: sum(transactions.amount),
      color: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        like(transactions.date, datePrefix),
        eq(transactions.type, "EXPENSE"),
        ne(transactions.source, "CARD_IMPORT")
      )
    )
    .groupBy(categories.name, categories.color)
    .all();

  // Category breakdown: card transactions
  const cardByCategory = db
    .select({
      category: categories.name,
      total: sum(cardTransactions.amount),
      color: categories.color,
    })
    .from(cardTransactions)
    .leftJoin(categories, eq(cardTransactions.categoryId, categories.id))
    .where(
      and(
        eq(cardTransactions.month, month),
        eq(cardTransactions.year, year)
      )
    )
    .groupBy(categories.name, categories.color)
    .all();

  // Merge category breakdowns
  const categoryMap = new Map<string, { category: string; total: number; color: string | null }>();
  for (const row of [...txByCategory, ...cardByCategory]) {
    const key = row.category ?? "Sin categoría";
    const existing = categoryMap.get(key);
    if (existing) {
      existing.total += Number(row.total ?? 0);
    } else {
      categoryMap.set(key, {
        category: key,
        total: Number(row.total ?? 0),
        color: row.color,
      });
    }
  }
  const categoryBreakdown = Array.from(categoryMap.values());

  // Upcoming payments (next 7 days, not paid)
  const today = new Date().toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const upcomingPayments = db
    .select({
      id: transactions.id,
      date: transactions.date,
      type: transactions.type,
      amount: transactions.amount,
      description: transactions.description,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.isPaid, false),
        gte(transactions.date, today),
        lte(transactions.date, in7Days)
      )
    )
    .orderBy(transactions.date)
    .all();

  // Monthly trend: last 6 months (exclude TRANSFER)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthlyTrend = db
    .select({
      month: sql<string>`strftime('%Y-%m', ${transactions.date})`.as("month"),
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN ${transactions.amount} ELSE 0 END), 0)`,
      expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'EXPENSE' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        gte(
          transactions.date,
          sql`date(${startDate}, '-5 months')`
        ),
        ne(transactions.type, "TRANSFER")
      )
    )
    .groupBy(sql`strftime('%Y-%m', ${transactions.date})`)
    .orderBy(sql`strftime('%Y-%m', ${transactions.date})`)
    .all();

  // Account balances: initial balance + only PAID movements since balance_date
  const allAccounts = db.select().from(accounts).all();
  const balanceDate = allAccounts[0]?.balanceDate ?? "2099-01-01";

  const accountBalances = allAccounts.map((acc) => {
    const accBalanceDate = acc.balanceDate ?? "2099-01-01";

    // Income for this account (after balanceDate - that day is already in initialBalance)
    const paidIncome = db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, acc.id),
          eq(transactions.type, "INCOME"),
          eq(transactions.isPaid, true),
          gt(transactions.date, accBalanceDate)
        )
      )
      .get();

    // Expenses for this account
    const paidExpense = db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, acc.id),
          eq(transactions.type, "EXPENSE"),
          eq(transactions.isPaid, true),
          gt(transactions.date, accBalanceDate)
        )
      )
      .get();

    // Transfers OUT (this account is origin)
    const transfersOut = db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, acc.id),
          eq(transactions.type, "TRANSFER"),
          gt(transactions.date, accBalanceDate)
        )
      )
      .get();

    // Transfers IN (this account is destination)
    const transfersIn = db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.toAccountId, acc.id),
          eq(transactions.type, "TRANSFER"),
          gt(transactions.date, accBalanceDate)
        )
      )
      .get();

    const currentBalance =
      acc.initialBalance +
      Number(paidIncome?.total ?? 0) -
      Number(paidExpense?.total ?? 0) -
      Number(transfersOut?.total ?? 0) +
      Number(transfersIn?.total ?? 0);

    return {
      id: acc.id,
      name: acc.name,
      bank: acc.bank,
      color: acc.color,
      balance: Math.round(currentBalance * 100) / 100,
    };
  });

  const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0);

  return {
    totalIncome,
    paidIncome,
    totalExpenses,
    paidExpenses,
    pendingExpenses,
    cardExpenses,
    balance,
    categoryBreakdown,
    upcomingPayments,
    monthlyTrend,
    accountBalances,
    totalBalance: Math.round(totalBalance * 100) / 100,
    reminders: getReminders(),
  };
}

function getReminders(): { type: "info" | "warning" | "action"; message: string }[] {
  const reminders: { type: "info" | "warning" | "action"; message: string }[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfMonth = today.getDate();

  // 1. Día 1-5: recordar generar fijos
  if (dayOfMonth <= 5) {
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}%`;
    const autoFixed = db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          like(transactions.date, monthPrefix),
          eq(transactions.source, "AUTO_FIXED")
        )
      )
      .get();

    if (!autoFixed) {
      reminders.push({
        type: "action",
        message: "Es principio de mes. Ve a Fijos → Generar mes para crear los gastos fijos de este mes.",
      });
    }
  }

  // 2. Gastos pendientes de pago esta semana
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const pendingThisWeek = db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.isPaid, false),
        eq(transactions.type, "EXPENSE"),
        gte(transactions.date, todayStr),
        lte(transactions.date, in7Days)
      )
    )
    .all();

  if (pendingThisWeek.length > 0) {
    reminders.push({
      type: "warning",
      message: `Tienes ${pendingThisWeek.length} gasto${pendingThisWeek.length > 1 ? "s" : ""} pendiente${pendingThisWeek.length > 1 ? "s" : ""} de pago esta semana.`,
    });
  }

  // 3. Última importación de tarjeta
  const lastCardImport = db
    .select({ importedAt: importBatches.importedAt })
    .from(importBatches)
    .orderBy(desc(importBatches.importedAt))
    .limit(1)
    .get();

  if (lastCardImport) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastCardImport.importedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 7) {
      reminders.push({
        type: "info",
        message: `Llevas ${daysSince} días sin importar movimientos de tarjeta.`,
      });
    }
  }

  // 4. Domingo: recordar apuntar gastos en efectivo
  if (today.getDay() === 0) {
    reminders.push({
      type: "info",
      message: "Es domingo. Buen momento para apuntar tus gastos en efectivo de la semana.",
    });
  }

  return reminders;
}
