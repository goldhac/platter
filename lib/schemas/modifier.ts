import { z } from "zod";
import { moneySchema, uuidSchema } from "./common";

export const modifierGroupSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  restaurant_id: uuidSchema,
  name: z.string().min(1),
  name_zh: z.string().nullable().optional(),
  min_select: z.number().int().min(0),
  max_select: z.number().int().min(1),
  is_required: z.boolean(),
});

export const modifierSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  group_id: uuidSchema,
  name: z.string().min(1),
  name_zh: z.string().nullable().optional(),
  price_delta: moneySchema,
  sort_order: z.number(),
  is_available: z.boolean(),
});

export type ModifierGroup = z.infer<typeof modifierGroupSchema>;
export type Modifier = z.infer<typeof modifierSchema>;
