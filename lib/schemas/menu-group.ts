import { z } from "zod";
import { slugSchema, uuidSchema } from "./common";

export const menuGroupSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  restaurant_id: uuidSchema,
  name: z.string().min(1),
  name_zh: z.string().nullable().optional(),
  slug: slugSchema,
  sort_order: z.number(),
  is_active: z.boolean(),
});

export const menuGroupInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_zh: z.string().optional(),
  slug: slugSchema.optional(),
  is_active: z.boolean().default(true),
});

export type MenuGroup = z.infer<typeof menuGroupSchema>;
export type MenuGroupInput = z.infer<typeof menuGroupInputSchema>;
