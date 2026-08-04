import { z } from "zod";
import {
  dietaryTagSchema,
  itemStatusSchema,
  moneySchema,
  slugSchema,
  spiceLevelSchema,
  uuidSchema,
} from "./common";
import { itemVariantSchema } from "./variant";

export const itemSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  restaurant_id: uuidSchema,
  category_id: uuidSchema,
  name: z.string().min(1),
  name_zh: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  description_zh: z.string().nullable().optional(),
  slug: slugSchema,
  base_price: moneySchema,
  compare_at_price: moneySchema.nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  image_blurhash: z.string().nullable().optional(),
  sort_order: z.number(),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  spice_level: spiceLevelSchema,
  dietary_tags: z.array(dietaryTagSchema),
  allergens: z.array(z.string()),
  prep_time_minutes: z.number().int().nullable().optional(),
  status: itemStatusSchema,
  published_at: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
});

/** The public menu row shape: an item with its variants embedded. */
export const itemWithVariantsSchema = itemSchema.extend({
  item_variants: z.array(itemVariantSchema).default([]),
});

/** Create/edit form input (server action + rhf share this). Slug is derived if omitted. */
export const itemInsertSchema = z.object({
  category_id: uuidSchema,
  name: z.string().min(1, "Name is required"),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  slug: slugSchema.optional(),
  base_price: moneySchema,
  compare_at_price: moneySchema.optional(),
  spice_level: spiceLevelSchema.default(0),
  dietary_tags: z.array(dietaryTagSchema).default([]),
  allergens: z.array(z.string()).default([]),
  prep_time_minutes: z.number().int().positive().optional(),
  is_featured: z.boolean().default(false),
  is_available: z.boolean().default(true),
  // Storage URL or a local seed path (not .url() so both are accepted); null clears it.
  image_url: z.string().nullable().optional(),
});

export type Item = z.infer<typeof itemSchema>;
export type ItemWithVariants = z.infer<typeof itemWithVariantsSchema>;
export type ItemInsert = z.infer<typeof itemInsertSchema>;
