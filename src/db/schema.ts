import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`)
    .$onUpdate(() => new Date().toISOString()),
};

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  bank: text("bank").notNull(),
  color: text("color"),
  icon: text("icon"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  initialBalance: real("initial_balance").notNull().default(0),
  balanceDate: text("balance_date"),
  ...timestamps,
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color"),
  icon: text("icon"),
  ...timestamps,
});

export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    type: text("type", { enum: ["INCOME", "EXPENSE", "TRANSFER"] }).notNull(),
    amount: real("amount").notNull(),
    description: text("description").notNull(),
    isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(false),
    notes: text("notes"),
    isFixed: integer("is_fixed", { mode: "boolean" }).notNull().default(false),
    categoryId: integer("category_id").references(() => categories.id),
    accountId: integer("account_id").references(() => accounts.id),
    toAccountId: integer("to_account_id").references(() => accounts.id),
    source: text("source", { enum: ["MANUAL", "CARD_IMPORT", "AUTO_FIXED", "BANK_IMPORT"] })
      .notNull()
      .default("MANUAL"),
    cardTransactionId: integer("card_transaction_id").references(
      () => cardTransactions.id
    ),
    ...timestamps,
  },
  (table) => [
    index("idx_transactions_date").on(table.date),
    index("idx_transactions_type_date").on(table.type, table.date),
    index("idx_transactions_category").on(table.categoryId),
    index("idx_transactions_account").on(table.accountId),
  ]
);

export const fixedTemplates = sqliteTable("fixed_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dayOfMonth: integer("day_of_month").notNull(),
  type: text("type", { enum: ["INCOME", "EXPENSE", "TRANSFER"] }).notNull(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  accountId: integer("account_id").references(() => accounts.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const cardTransactions = sqliteTable(
  "card_transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    uid: text("uid").notNull().unique(),
    date: text("date").notNull(),
    merchant: text("merchant").notNull(),
    description: text("description"),
    amount: real("amount").notNull(),
    month: integer("month"),
    year: integer("year"),
    categoryId: integer("category_id").references(() => categories.id),
    accountId: integer("account_id").references(() => accounts.id),
    importBatchId: integer("import_batch_id").references(() => importBatches.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("idx_card_transactions_uid").on(table.uid),
    index("idx_card_transactions_year_month").on(table.year, table.month),
  ]
);

export const merchantMappings = sqliteTable("merchant_mappings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  merchantPattern: text("merchant_pattern").notNull().unique(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  ...timestamps,
});

export const debts = sqliteTable(
  "debts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: ["RECEIVABLE", "PAYABLE"] }).notNull(),
    personName: text("person_name").notNull(),
    description: text("description").notNull(),
    amount: real("amount").notNull(),
    date: text("date").notNull(),
    dueDate: text("due_date"),
    status: text("status", { enum: ["PENDING", "SETTLED"] })
      .notNull()
      .default("PENDING"),
    settledAt: text("settled_at"),
    transactionId: integer("transaction_id").references(() => transactions.id),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("idx_debts_status").on(table.status),
    index("idx_debts_type").on(table.type),
    index("idx_debts_person").on(table.personName),
  ]
);

export const importBatches = sqliteTable("import_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename"),
  rowCount: integer("row_count"),
  duplicatesSkipped: integer("duplicates_skipped"),
  settlementAmount: real("settlement_amount"),
  billingMonth: integer("billing_month"),
  billingYear: integer("billing_year"),
  importedAt: text("imported_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
