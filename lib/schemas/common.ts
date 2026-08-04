import { z } from "zod";

// Shared primitives. lib/schemas is the single source of truth for shape
// (foundation.md §7 #15); nothing app-specific is imported here.

export const uuidSchema = z.string().uuid();

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase words separated by single hyphens");

export const spiceLevelSchema = z.number().int().min(0).max(3);
export const itemStatusSchema = z.enum(["draft", "published"]);
export const dietaryTagSchema = z.enum([
  "vegetarian",
  "vegan",
  "contains_pork",
  "seafood",
  "gluten_free",
]);
export const currencyCodeSchema = z.string().length(3);
export const moneySchema = z.number().nonnegative().finite();

export type Slug = z.infer<typeof slugSchema>;
export type ItemStatus = z.infer<typeof itemStatusSchema>;
export type DietaryTag = z.infer<typeof dietaryTagSchema>;
