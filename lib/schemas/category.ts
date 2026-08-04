import { z } from "zod";
import { slugSchema, uuidSchema } from "./common";

export const categorySchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  restaurant_id: uuidSchema,
  group_id: uuidSchema.nullable().optional(),
  name: z.string().min(1),
  name_zh: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  slug: slugSchema,
  image_url: z.string().url().nullable().optional(),
  sort_order: z.number(),
  is_active: z.boolean(),
  available_from: z.string().nullable().optional(),
  available_to: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
});

export const categoryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  slug: slugSchema.optional(),
  group_id: uuidSchema.optional(),
  available_from: z.string().optional(),
  available_to: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
