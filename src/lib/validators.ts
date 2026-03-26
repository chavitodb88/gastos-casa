import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hex inválido").nullable().optional(),
  icon: z.string().nullable().optional(),
});

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive("El importe debe ser positivo"),
  description: z.string().min(1, "La descripción es obligatoria"),
  isPaid: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  isFixed: z.boolean().default(false),
  categoryId: z.number().int().positive().nullable().optional(),
  accountId: z.number().int().positive().nullable().optional(),
  toAccountId: z.number().int().positive().nullable().optional(),
});

export const fixedTemplateSchema = z.object({
  dayOfMonth: z.number().int().min(1).max(31),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive("El importe debe ser positivo"),
  description: z.string().min(1, "La descripción es obligatoria"),
  categoryId: z.number().int().positive().nullable().optional(),
  accountId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const accountSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  bank: z.string().min(1, "El banco es obligatorio"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hex inválido").nullable().optional(),
  icon: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
});

export const merchantMappingSchema = z.object({
  merchantPattern: z.string().min(1, "El patrón es obligatorio"),
  categoryId: z.number().int().positive("La categoría es obligatoria"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type FixedTemplateInput = z.infer<typeof fixedTemplateSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type MerchantMappingInput = z.infer<typeof merchantMappingSchema>;
