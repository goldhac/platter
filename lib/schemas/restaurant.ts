import { z } from "zod";
import { currencyCodeSchema, slugSchema, uuidSchema } from "./common";

export const restaurantSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  name: z.string().min(1),
  name_zh: z.string().nullable().optional(),
  slug: slugSchema,
  logo_url: z.string().url().nullable().optional(),
  hero_image_url: z.string().url().nullable().optional(),
  currency: currencyCodeSchema,
  locale: z.string(),
  timezone: z.string(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  theme: z.record(z.string(), z.unknown()).default({}),
  ordering_enabled: z.boolean(),
  sold_out_reset_time: z.string(),
});

export type Restaurant = z.infer<typeof restaurantSchema>;

/** The money-formatting context every price render needs (lib/format). */
export type CurrencyContext = Pick<Restaurant, "currency" | "locale">;
