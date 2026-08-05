// Server-only. Menu extraction via Google Gemini's REST API (no SDK dependency —
// one endpoint, structured-JSON output enforced by responseSchema). The key lives
// ONLY in process.env.GEMINI_API_KEY (never hardcoded, never sent to the client).
import { z } from "zod";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const ENDPOINT = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

// ── The parsed-menu contract (what the review UI + commit code code against) ──
export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "contains_pork",
  "seafood",
  "gluten_free",
] as const;

const parsedItem = z.object({
  name: z.string().min(1),
  description: z.string().nullish().transform((v) => v ?? undefined),
  // Gemini may return a string; coerce and never throw (unreadable price → 0).
  price: z.coerce.number().nonnegative().catch(0),
  spice_level: z.coerce.number().int().min(0).max(3).catch(0),
  dietary_tags: z.array(z.string()).default([]),
});
const parsedCategory = z.object({
  name: z.string().min(1),
  items: z.array(parsedItem).default([]),
});
const parsedGroup = z.object({
  name: z.string().min(1),
  categories: z.array(parsedCategory).default([]),
});
export const parsedMenuSchema = z.object({
  menuName: z.string().min(1).default("Imported Menu"),
  groups: z.array(parsedGroup).default([]),
});

export type ParsedItem = z.infer<typeof parsedItem>;
export type ParsedCategory = z.infer<typeof parsedCategory>;
export type ParsedGroup = z.infer<typeof parsedGroup>;
export type ParsedMenu = z.infer<typeof parsedMenuSchema>;

// Gemini's responseSchema is an OpenAPI subset — it forces the model to emit
// exactly this shape, so parsing is reliable.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    menuName: { type: "STRING" },
    groups: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          categories: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                items: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      description: { type: "STRING" },
                      price: { type: "NUMBER" },
                      spice_level: { type: "INTEGER" },
                      dietary_tags: { type: "ARRAY", items: { type: "STRING" } },
                    },
                    required: ["name", "price"],
                  },
                },
              },
              required: ["name", "items"],
            },
          },
        },
        required: ["name", "categories"],
      },
    },
  },
  required: ["menuName", "groups"],
};

const PROMPT = `You are a menu digitizer. Extract EVERY item from this restaurant menu (image or PDF) into the required JSON.

Structure:
- A "group" is a top-level section (e.g. Food, Drinks, Wine). A "category" is a sub-section within it (e.g. Starters, Mains, Cocktails).
- If the menu has only ONE level of sections, use a single group named "Menu" and put every section as a category under it.

Per item:
- name: exactly as printed.
- description: the printed description if any; otherwise omit.
- price: a plain number, no currency symbol or thousands separators (e.g. "₦6,000" → 6000, "$12.50" → 12.5). If an item lists several sizes/prices, use the SMALLEST as price and note the sizes in the description. If a price is unreadable, use 0.
- spice_level: 0–3, and only when the menu clearly marks spiciness (chili icons, "spicy", "hot"); otherwise 0.
- dietary_tags: only from explicit menu markers, each one of exactly: vegetarian, vegan, contains_pork, seafood, gluten_free. Never guess.

Rules: Never invent items, prices, or descriptions. Transcribe only what is on the menu. Preserve the menu's own order.`;

export type ExtractResult =
  | { ok: true; menu: ParsedMenu }
  | { ok: false; error: string };

/**
 * Read a menu image/PDF (base64) and return its structured contents.
 * `mimeType` e.g. "image/jpeg", "image/png", "application/pdf".
 */
export async function extractMenu(base64: string, mimeType: string): Promise<ExtractResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: "Menu import isn't configured — GEMINI_API_KEY is not set on the server.",
    };
  }

  const body = {
    contents: [
      {
        parts: [{ text: PROMPT }, { inlineData: { mimeType, data: base64 } }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0, // transcription, not creativity
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  let res: Response;
  try {
    res = await fetch(ENDPOINT(MODEL, key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    const aborted = e instanceof Error && e.name === "AbortError";
    return { ok: false, error: aborted ? "The menu took too long to read — try a clearer or smaller image." : "Couldn't reach the AI service. Check your connection and try again." };
  }
  clearTimeout(timeout);

  if (!res.ok) {
    // Map the common failures to something a restaurant owner can act on.
    if (res.status === 400 || res.status === 403) {
      return { ok: false, error: "The AI service rejected the request (bad key or unsupported file)." };
    }
    if (res.status === 429) {
      return { ok: false, error: "The AI service is rate-limited right now — wait a moment and retry." };
    }
    return { ok: false, error: `The AI service returned an error (${res.status}).` };
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };

  if (json.promptFeedback?.blockReason) {
    return { ok: false, error: "The image was blocked by a safety filter — try a different photo." };
  }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return { ok: false, error: "The AI couldn't read a menu from this file — try a clearer photo." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "The AI returned an unreadable result — please try again." };
  }

  const parsed = parsedMenuSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "The menu structure came back malformed — please try again." };
  }

  // Keep only recognised dietary tags; drop empties.
  const allowed = new Set<string>(DIETARY_TAGS);
  const menu: ParsedMenu = {
    menuName: parsed.data.menuName.trim() || "Imported Menu",
    groups: parsed.data.groups
      .map((g) => ({
        name: g.name.trim(),
        categories: g.categories
          .map((c) => ({
            name: c.name.trim(),
            items: c.items
              .filter((it) => it.name.trim())
              .map((it) => ({
                name: it.name.trim(),
                description: it.description?.trim() || undefined,
                price: Math.max(0, it.price),
                spice_level: it.spice_level,
                dietary_tags: it.dietary_tags.filter((t) => allowed.has(t)),
              })),
          }))
          .filter((c) => c.name && c.items.length > 0),
      }))
      .filter((g) => g.name && g.categories.length > 0),
  };

  if (menu.groups.length === 0) {
    return { ok: false, error: "No menu items were found in this file — try a clearer or fuller photo." };
  }

  return { ok: true, menu };
}
