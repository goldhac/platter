import { z } from "zod";
import { moneySchema, uuidSchema } from "./common";

export const itemVariantSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  item_id: uuidSchema,
  label: z.string().min(1),
  label_zh: z.string().nullable().optional(),
  price: moneySchema, // absolute price, not a delta (foundation.md §7 #13)
  sort_order: z.number(),
  is_available: z.boolean(),
});

export const itemVariantInputSchema = z.object({
  label: z.string().min(1, "Label is required"),
  label_zh: z.string().optional(),
  price: moneySchema,
  is_available: z.boolean().default(true),
});

export type ItemVariant = z.infer<typeof itemVariantSchema>;
export type ItemVariantInput = z.infer<typeof itemVariantInputSchema>;
